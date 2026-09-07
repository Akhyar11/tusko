<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReceiptTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceiptTemplateController extends Controller
{
    /**
     * Get the active receipt template configuration.
     */
    public function show(): JsonResponse
    {
        $template = ReceiptTemplate::getActiveTemplate();

        return response()->json([
            'data' => $template,
        ]);
    }

    /**
     * Store or update receipt template configuration.
     */
    public function store(Request $request): JsonResponse
    {
        $template = ReceiptTemplate::getActiveTemplate();

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'paper_size' => 'nullable|string|in:100x150,100x100,a4',
            'barcode_type' => 'nullable|string|in:code128,qrcode,dual',
            'barcode_height' => 'nullable|string|in:small,medium,large',
            'address_font_size' => 'nullable|string|in:small,normal,large',
            'show_items_list' => 'nullable|boolean',
            'show_buyer_notes' => 'nullable|boolean',
            'show_sorting_code' => 'nullable|boolean',
            'show_unboxing_notice' => 'nullable|boolean',
            'show_cod_badge' => 'nullable|boolean',
            'sender_name' => 'nullable|string|max:255',
            'sender_phone' => 'nullable|string|max:50',
            'sender_address' => 'nullable|string|max:500',
            'footer_note' => 'nullable|string|max:500',
            'courier_brand_tag' => 'nullable|string|max:255',
            'is_default' => 'nullable|boolean',

            // Also support camelCase input from React
            'paperSize' => 'nullable|string|in:100x150,100x100,a4',
            'barcodeType' => 'nullable|string|in:code128,qrcode,dual',
            'barcodeHeight' => 'nullable|string|in:small,medium,large',
            'addressFontSize' => 'nullable|string|in:small,normal,large',
            'showItemsList' => 'nullable|boolean',
            'showBuyerNotes' => 'nullable|boolean',
            'showSortingCode' => 'nullable|boolean',
            'showUnboxingNotice' => 'nullable|boolean',
            'showCodBadge' => 'nullable|boolean',
            'senderName' => 'nullable|string|max:255',
            'senderPhone' => 'nullable|string|max:50',
            'senderAddress' => 'nullable|string|max:500',
            'footerNote' => 'nullable|string|max:500',
            'courierBrandTag' => 'nullable|string|max:255',
        ]);

        $updateData = [
            'name' => $validated['name'] ?? $template->name,
            'paper_size' => $validated['paper_size'] ?? $validated['paperSize'] ?? $template->paper_size,
            'barcode_type' => $validated['barcode_type'] ?? $validated['barcodeType'] ?? $template->barcode_type,
            'barcode_height' => $validated['barcode_height'] ?? $validated['barcodeHeight'] ?? $template->barcode_height,
            'address_font_size' => $validated['address_font_size'] ?? $validated['addressFontSize'] ?? $template->address_font_size,
            'show_items_list' => $validated['show_items_list'] ?? $validated['showItemsList'] ?? $template->show_items_list,
            'show_buyer_notes' => $validated['show_buyer_notes'] ?? $validated['showBuyerNotes'] ?? $template->show_buyer_notes,
            'show_sorting_code' => $validated['show_sorting_code'] ?? $validated['showSortingCode'] ?? $template->show_sorting_code,
            'show_unboxing_notice' => $validated['show_unboxing_notice'] ?? $validated['showUnboxingNotice'] ?? $template->show_unboxing_notice,
            'show_cod_badge' => $validated['show_cod_badge'] ?? $validated['showCodBadge'] ?? $template->show_cod_badge,
            'sender_name' => $validated['sender_name'] ?? $validated['senderName'] ?? $template->sender_name,
            'sender_phone' => $validated['sender_phone'] ?? $validated['senderPhone'] ?? $template->sender_phone,
            'sender_address' => $validated['sender_address'] ?? $validated['senderAddress'] ?? $template->sender_address,
            'footer_note' => $validated['footer_note'] ?? $validated['footerNote'] ?? $template->footer_note,
            'courier_brand_tag' => $validated['courier_brand_tag'] ?? $validated['courierBrandTag'] ?? $template->courier_brand_tag,
        ];

        $template->update($updateData);

        return response()->json([
            'message' => 'Pengaturan template resi pengiriman berhasil disimpan.',
            'data' => $template->fresh(),
        ]);
    }

    /**
     * Reset receipt template to default configuration.
     */
    public function reset(): JsonResponse
    {
        $template = ReceiptTemplate::getActiveTemplate();
        $template->update(ReceiptTemplate::defaultConfiguration());

        return response()->json([
            'message' => 'Template resi berhasil dikembalikan ke format awal pabrik.',
            'data' => $template->fresh(),
        ]);
    }
}
