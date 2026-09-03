<?php

namespace App\Services\Content;

use App\Models\Bookmark;
use App\Models\Category;
use App\Models\Content;
use App\Models\User;
use App\Models\ViewHistory;
use App\Services\Upload\UploadService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use RuntimeException;

class ContentService
{
    public function __construct(private UploadService $uploads) {}

    /** @param array{verified?: bool, is_admin?: bool, user_id?: ?string} $viewer */
    public function listCategories(?string $module, bool $admin = false): array
    {
        $query = Category::query()->orderBy('sort_order');

        if ($module) {
            $query->where('module', $module);
        }

        if (! $admin) {
            $query->where('is_active', true);
        }

        return $query->get()->map(fn (Category $c) => $c->toApiArray())->all();
    }

    public function createCategory(array $input): array
    {
        $this->validateModule($input['module'] ?? '');
        $name = trim($input['name'] ?? '');
        if ($name === '') {
            throw new RuntimeException('Validation failed', 422);
        }

        $slug = trim($input['slug'] ?? '') ?: $this->slugify($name);
        $category = Category::query()->create([
            'id' => (string) Str::uuid(),
            'module' => $input['module'],
            'name' => $name,
            'slug' => $slug,
            'sort_order' => (int) ($input['sort_order'] ?? 0),
            'is_active' => $input['is_active'] ?? true,
        ]);

        return $category->toApiArray();
    }

    public function updateCategory(string $id, array $input): array
    {
        $category = Category::query()->find($id);
        if (! $category) {
            throw new RuntimeException('Not found', 404);
        }

        if (! empty($input['module'])) {
            $this->validateModule($input['module']);
            $category->module = $input['module'];
        }
        if (! empty(trim($input['name'] ?? ''))) {
            $category->name = trim($input['name']);
        }
        if (! empty(trim($input['slug'] ?? ''))) {
            $category->slug = trim($input['slug']);
        }
        if (isset($input['sort_order'])) {
            $category->sort_order = (int) $input['sort_order'];
        }
        if (isset($input['is_active'])) {
            $category->is_active = (bool) $input['is_active'];
        }
        $category->save();

        return $category->toApiArray();
    }

    public function deleteCategory(string $id): void
    {
        $category = Category::query()->find($id);
        if (! $category) {
            throw new RuntimeException('Not found', 404);
        }
        $category->delete();
    }

    public function listContents(array $filters, array $viewer, int $page, int $perPage): array
    {
        if (empty($viewer['is_admin'])) {
            $filters['status'] = Content::STATUS_PUBLISHED;
        }

        $query = $this->contentQuery($filters);
        $total = (clone $query)->count();
        $items = $query->offset(($page - 1) * $perPage)->limit($perPage)->get();

        $dtos = $items->map(fn (Content $c) => $this->toDto($c, $viewer, false, false))->all();

        return [$dtos, $total];
    }

    public function getBySlug(string $slug, array $viewer): array
    {
        $content = Content::query()->with('category')->where('slug', $slug)->first();
        if (! $content) {
            throw new RuntimeException('Not found', 404);
        }

        if (empty($viewer['is_admin']) && $content->status !== Content::STATUS_PUBLISHED) {
            throw new RuntimeException('Not found', 404);
        }

        $bookmarked = false;
        if (! empty($viewer['user_id'])) {
            $bookmarked = Bookmark::query()
                ->where('user_id', $viewer['user_id'])
                ->where('content_id', $content->id)
                ->exists();
        }

        return $this->toDto($content, $viewer, true, $bookmarked);
    }

    public function createContent(User $author, array $input): array
    {
        $content = $this->buildContent($author->id, null, $input);
        $content->save();

        return $this->toDto($content->load('category'), ['verified' => true, 'is_admin' => true], true, false);
    }

    public function updateContent(string $id, array $input): array
    {
        $existing = Content::query()->find($id);
        if (! $existing) {
            throw new RuntimeException('Not found', 404);
        }

        $content = $this->buildContent($existing->created_by, $existing, $input);
        $content->save();

        return $this->toDto($content->load('category'), ['verified' => true, 'is_admin' => true], true, false);
    }

    public function deleteContent(string $id): void
    {
        $content = Content::query()->find($id);
        if (! $content) {
            throw new RuntimeException('Not found', 404);
        }
        $content->delete();
    }

    public function publishContent(string $id): array
    {
        $content = Content::query()->find($id);
        if (! $content) {
            throw new RuntimeException('Not found', 404);
        }

        $content->update([
            'status' => Content::STATUS_PUBLISHED,
            'published_at' => $content->published_at ?? now(),
        ]);

        return $this->toDto($content->load('category'), ['verified' => true, 'is_admin' => true], true, false);
    }

    public function listBookmarks(string $userId): array
    {
        $viewer = ['user_id' => $userId, 'verified' => true];

        return Bookmark::query()
            ->with(['content.category'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Bookmark $b) => $b->content ? $this->toDto($b->content, $viewer, false, true) : null)
            ->filter()
            ->values()
            ->all();
    }

    public function addBookmark(string $userId, string $contentId): void
    {
        if (! Content::query()->find($contentId)) {
            throw new RuntimeException('Not found', 404);
        }

        Bookmark::query()->firstOrCreate([
            'user_id' => $userId,
            'content_id' => $contentId,
        ], ['id' => (string) Str::uuid()]);
    }

    public function removeBookmark(string $userId, string $contentId): void
    {
        Bookmark::query()
            ->where('user_id', $userId)
            ->where('content_id', $contentId)
            ->delete();
    }

    public function upsertHistory(string $userId, string $contentId, array $input): void
    {
        if (! Content::query()->find($contentId)) {
            throw new RuntimeException('Not found', 404);
        }

        ViewHistory::query()->updateOrCreate(
            ['user_id' => $userId, 'content_id' => $contentId],
            [
                'id' => ViewHistory::query()
                    ->where('user_id', $userId)
                    ->where('content_id', $contentId)
                    ->value('id') ?? (string) Str::uuid(),
                'progress_pct' => min(100, max(0, (int) ($input['progress_pct'] ?? 0))),
                'last_position_sec' => (int) ($input['last_position_sec'] ?? 0),
                'completed' => (bool) ($input['completed'] ?? false),
            ]
        );
    }

    public function listHistory(string $userId, int $limit = 50): array
    {
        $viewer = ['user_id' => $userId, 'verified' => true];

        return ViewHistory::query()
            ->with(['content.category'])
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(function (ViewHistory $h) use ($viewer) {
                $row = $h->toApiArray();
                if ($h->content) {
                    $row['content'] = $this->toDto($h->content, $viewer, false, false);
                }

                return $row;
            })
            ->all();
    }

    public function continueLearning(string $userId, int $limit = 12): array
    {
        $viewer = ['user_id' => $userId, 'verified' => true];

        return ViewHistory::query()
            ->with(['content.category'])
            ->where('user_id', $userId)
            ->where('completed', false)
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (ViewHistory $h) => $h->content ? $this->toDto($h->content, $viewer, false, false) : null)
            ->filter()
            ->values()
            ->all();
    }

    /** @param array{verified?: bool, is_admin?: bool, user_id?: ?string} $viewer */
    public function toDto(Content $content, array $viewer, bool $full, bool $bookmarked): array
    {
        $verified = ! empty($viewer['verified']) || ! empty($viewer['is_admin']);
        $locked = $content->is_premium && ! $verified;

        $dto = [
            'id' => $content->id,
            'module' => $content->module,
            'type' => $content->type,
            'title' => $content->title,
            'slug' => $content->slug,
            'excerpt' => $content->excerpt,
            'is_premium' => (bool) $content->is_premium,
            'locked' => $locked,
            'status' => $content->status,
            'bookmarked' => $bookmarked,
            'created_at' => $content->created_at?->toISOString(),
        ];

        if ($content->category_id) {
            $dto['category_id'] = $content->category_id;
        }
        if ($content->relationLoaded('category') && $content->category) {
            $dto['category_name'] = $content->category->name;
        }
        if ($content->thumbnail_url) {
            $dto['thumbnail_url'] = $content->thumbnail_url;
        }
        if ($content->published_at) {
            $dto['published_at'] = $content->published_at->toISOString();
        }
        if ($content->duration_sec !== null) {
            $dto['duration_sec'] = (int) $content->duration_sec;
        }

        if ($full && ! $locked) {
            $dto['body'] = $content->body;
            if ($content->video_url) {
                $dto['video_url'] = $content->video_url;
            }
        }

        return $dto;
    }

    public static function viewerFromUser(?User $user): array
    {
        if (! $user) {
            return ['verified' => false, 'is_admin' => false, 'user_id' => null];
        }

        return [
            'user_id' => $user->id,
            'verified' => $user->isVerifiedMember(),
            'is_admin' => $user->isAdmin(),
        ];
    }

    private function contentQuery(array $filters): Builder
    {
        $query = Content::query()->with('category')->orderByDesc('published_at');

        if (! empty($filters['module'])) {
            $query->where('module', $filters['module']);
        }
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['q'])) {
            $q = '%'.$filters['q'].'%';
            $query->where(function (Builder $b) use ($q) {
                $b->where('title', 'like', $q)->orWhere('excerpt', 'like', $q);
            });
        }

        return $query;
    }

    private function buildContent(string $authorId, ?Content $existing, array $input): Content
    {
        $this->validateModule($input['module'] ?? ($existing?->module ?? ''));
        $type = $input['type'] ?? $existing?->type;
        if (! in_array($type, [Content::TYPE_VIDEO, Content::TYPE_ARTICLE], true)) {
            throw new RuntimeException('Validation failed', 422);
        }

        $title = trim($input['title'] ?? ($existing?->title ?? ''));
        if ($title === '') {
            throw new RuntimeException('Validation failed', 422);
        }

        $slug = trim($input['slug'] ?? '') ?: $this->slugify($title);
        $slugQuery = Content::query()->where('slug', $slug);
        if ($existing) {
            $slugQuery->where('id', '!=', $existing->id);
        }
        if ($slugQuery->exists()) {
            throw new RuntimeException('conflict', 409);
        }

        $status = trim($input['status'] ?? ($existing?->status ?? Content::STATUS_DRAFT));
        if (! in_array($status, [Content::STATUS_DRAFT, Content::STATUS_PUBLISHED, Content::STATUS_ARCHIVED], true)) {
            throw new RuntimeException('Validation failed', 422);
        }

        $premium = array_key_exists('is_premium', $input)
            ? (bool) $input['is_premium']
            : ($existing?->is_premium ?? true);

        $categoryId = $input['category_id'] ?? $existing?->category_id;
        if ($categoryId && ! Category::query()->find($categoryId)) {
            throw new RuntimeException('Validation failed', 422);
        }

        $thumbnailUrl = $existing?->thumbnail_url;
        if (! empty($input['thumbnail_key'])) {
            $thumbnailUrl = $this->uploads->urlForKey($input['thumbnail_key']);
        } elseif (array_key_exists('thumbnail_url', $input)) {
            $thumbnailUrl = $input['thumbnail_url'];
        }

        $videoUrl = $existing?->video_url;
        if (! empty($input['video_key'])) {
            $videoUrl = $this->uploads->urlForKey($input['video_key']);
        } elseif (array_key_exists('video_url', $input)) {
            $videoUrl = $input['video_url'];
        }

        $content = $existing ?? new Content(['id' => (string) Str::uuid(), 'created_by' => $authorId]);
        $content->fill([
            'category_id' => $categoryId,
            'module' => $input['module'] ?? $existing->module,
            'type' => $type,
            'title' => $title,
            'slug' => $slug,
            'excerpt' => $input['excerpt'] ?? $existing?->excerpt,
            'body' => $input['body'] ?? $existing?->body,
            'thumbnail_url' => $thumbnailUrl,
            'video_url' => $videoUrl,
            'duration_sec' => $input['duration_sec'] ?? $existing?->duration_sec,
            'is_premium' => $premium,
            'status' => $status,
        ]);

        if ($status === Content::STATUS_PUBLISHED && ! $content->published_at) {
            $content->published_at = now();
        }

        return $content;
    }

    private function validateModule(string $module): void
    {
        if (! in_array($module, [
            Content::MODULE_ACADEMY,
            Content::MODULE_PSYCHOLOGY,
            Content::MODULE_DAILY_ANALYSIS,
            Content::MODULE_LANDING,
        ], true)) {
            throw new RuntimeException('Validation failed', 422);
        }
    }

    private function slugify(string $value): string
    {
        $slug = strtolower(trim($value));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
        $slug = trim($slug, '-');

        return $slug !== '' ? $slug : substr((string) Str::uuid(), 0, 8);
    }
}
