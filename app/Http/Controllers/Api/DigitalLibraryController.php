<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DigitalLibraryController extends Controller
{
    /**
     * Unified Library Search: combines Eyitayo School Library Resources, Open Library, and Google Books.
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));
        $category = $request->input('category', 'all'); // 'all', 'school', 'open_library', 'google_books'
        $classId = $request->input('school_class_id');

        $results = [
            'school_library' => [],
            'open_library' => [],
            'google_books' => [],
            'total' => 0,
        ];

        // 1. Eyitayo School Library
        if ($category === 'all' || $category === 'school') {
            $schoolQuery = Resource::with(['uploader:id,full_name,email', 'schoolClass:id,name']);
            if (!empty($query)) {
                $schoolQuery->where('title', 'like', "%{$query}%");
            }
            if (!empty($classId)) {
                $schoolQuery->where(function ($q) use ($classId) {
                    $q->where('school_class_id', $classId)
                      ->orWhereNull('school_class_id');
                });
            }

            $schoolResources = $schoolQuery->latest()->get()->map(function ($r) {
                return [
                    'id' => 'school_' . $r->id,
                    'title' => $r->title,
                    'author' => $r->uploader?->full_name ?? 'Eyitayo Faculty',
                    'type' => $r->type ?? 'pdf',
                    'url' => $r->url,
                    'cover_image' => null,
                    'class_name' => $r->schoolClass?->name ?? 'Global (All Classes)',
                    'source' => 'Eyitayo School Library',
                    'created_at' => $r->created_at?->format('M d, Y'),
                ];
            });

            $results['school_library'] = $schoolResources;
        }

        // 2. Open Library API Search
        if (($category === 'all' || $category === 'open_library') && !empty($query)) {
            try {
                $olRes = Http::timeout(6)->get('https://openlibrary.org/search.json', [
                    'q' => $query,
                    'limit' => 10,
                    'fields' => 'key,title,author_name,first_publish_year,cover_i,ebook_access,edition_count'
                ]);

                if ($olRes->successful()) {
                    $docs = $olRes->json('docs') ?? [];
                    $results['open_library'] = array_map(function ($doc) {
                        $coverId = $doc['cover_i'] ?? null;
                        return [
                            'id' => 'ol_' . ($doc['key'] ?? uniqid()),
                            'title' => $doc['title'] ?? 'Unknown Title',
                            'author' => !empty($doc['author_name']) ? implode(', ', array_slice($doc['author_name'], 0, 2)) : 'Various Authors',
                            'publish_year' => $doc['first_publish_year'] ?? null,
                            'cover_image' => $coverId ? "https://covers.openlibrary.org/b/id/{$coverId}-M.jpg" : null,
                            'url' => isset($doc['key']) ? "https://openlibrary.org{$doc['key']}" : "https://openlibrary.org",
                            'source' => 'Open Library',
                        ];
                    }, $docs);
                }
            } catch (\Throwable $e) {
                Log::info("Open Library search skipped: " . $e->getMessage());
            }
        }

        // 3. Google Books API Search
        if (($category === 'all' || $category === 'google_books') && !empty($query)) {
            try {
                $gbRes = Http::timeout(6)->get('https://www.googleapis.com/books/v1/volumes', [
                    'q' => $query,
                    'maxResults' => 10,
                    'printType' => 'books',
                ]);

                if ($gbRes->successful()) {
                    $items = $gbRes->json('items') ?? [];
                    $results['google_books'] = array_map(function ($item) {
                        $info = $item['volumeInfo'] ?? [];
                        return [
                            'id' => 'gb_' . ($item['id'] ?? uniqid()),
                            'title' => $info['title'] ?? 'Unknown Title',
                            'author' => !empty($info['authors']) ? implode(', ', $info['authors']) : 'Unknown Author',
                            'description' => $info['description'] ?? null,
                            'cover_image' => $info['imageLinks']['thumbnail'] ?? null,
                            'url' => $info['previewLink'] ?? ($info['infoLink'] ?? "https://books.google.com"),
                            'source' => 'Google Books',
                            'categories' => $info['categories'] ?? [],
                        ];
                    }, $items);
                }
            } catch (\Throwable $e) {
                Log::info("Google Books search skipped: " . $e->getMessage());
            }
        }

        $results['total'] = count($results['school_library']) + count($results['open_library']) + count($results['google_books']);

        return response()->json($results);
    }
}
