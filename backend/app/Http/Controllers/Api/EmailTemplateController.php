<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailTemplateController extends Controller
{
    /**
     * Display a listing of email templates.
     */
    public function index(): JsonResponse
    {
        EmailTemplate::ensureDefaultTemplates();
        $templates = EmailTemplate::orderBy('id')->get();

        return response()->json([
            'data' => $templates,
        ]);
    }

    /**
     * Display the specified email template.
     */
    public function show(string $idOrKey): JsonResponse
    {
        $template = EmailTemplate::where('id', $idOrKey)
            ->orWhere('key', $idOrKey)
            ->firstOrFail();

        return response()->json([
            'data' => $template,
        ]);
    }

    /**
     * Store a new email template (or upsert by key).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'event' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'from_name' => 'nullable|string|max:100',
            'reply_to' => 'nullable|string|max:100',
            'color_theme' => 'nullable|string|max:50',
            'subject' => 'required|string|max:255',
            'preheader' => 'nullable|string|max:255',
            'headline' => 'nullable|string|max:255',
            'body' => 'required|string',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $template = EmailTemplate::updateOrCreate(
            ['key' => $validated['key']],
            $validated
        );

        return response()->json([
            'message' => "Template email '{$template->name}' berhasil disimpan.",
            'data' => $template,
        ], 201);
    }

    /**
     * Update the specified email template.
     */
    public function update(Request $request, string $idOrKey): JsonResponse
    {
        $template = EmailTemplate::where('id', $idOrKey)
            ->orWhere('key', $idOrKey)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'event' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'from_name' => 'nullable|string|max:100',
            'reply_to' => 'nullable|string|max:100',
            'color_theme' => 'nullable|string|max:50',
            'subject' => 'sometimes|required|string|max:255',
            'preheader' => 'nullable|string|max:255',
            'headline' => 'nullable|string|max:255',
            'body' => 'sometimes|required|string',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $template->update($validated);

        return response()->json([
            'message' => "Template email '{$template->name}' berhasil diperbarui.",
            'data' => $template->fresh(),
        ]);
    }

    /**
     * Reset templates to system default.
     */
    public function reset(): JsonResponse
    {
        EmailTemplate::truncate();
        EmailTemplate::ensureDefaultTemplates();

        return response()->json([
            'message' => 'Template email berhasil direset ke konfigurasi awal bawaan sistem.',
            'data' => EmailTemplate::orderBy('id')->get(),
        ]);
    }
}
