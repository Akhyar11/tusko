<?php

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{idOrSlug}', [ProductController::class, 'show']);
});

Route::prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/items', [CartController::class, 'addItem']);
    Route::put('/items/{id}', [CartController::class, 'updateItem']);
    Route::delete('/items/{id}', [CartController::class, 'removeItem']);
    Route::delete('/clear', [CartController::class, 'clear']);
});

Route::prefix('addresses')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ShippingAddressController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\ShippingAddressController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\ShippingAddressController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\ShippingAddressController::class, 'destroy']);
    Route::post('/{id}/set-default', [\App\Http\Controllers\Api\ShippingAddressController::class, 'setDefault']);
});

Route::prefix('expeditions')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ExpeditionController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\ExpeditionController::class, 'store']);
    Route::get('/categories', [\App\Http\Controllers\Api\ExpeditionController::class, 'categories']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ExpeditionController::class, 'show']);
    Route::match(['put', 'patch'], '/{id}', [\App\Http\Controllers\Api\ExpeditionController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\ExpeditionController::class, 'destroy']);
    Route::post('/{id}/set-default', [\App\Http\Controllers\Api\ExpeditionController::class, 'setDefault']);
    Route::post('/{id}/default', [\App\Http\Controllers\Api\ExpeditionController::class, 'setDefault']);
});


Route::post('/checkout', [\App\Http\Controllers\Api\CheckoutController::class, 'checkout']);
Route::prefix('orders')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\OrderController::class, 'index']);
    Route::post('/{idOrOrderNumber}/generate-receipt', [\App\Http\Controllers\Api\OrderController::class, 'generateReceipt'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/generate-tracking', [\App\Http\Controllers\Api\OrderController::class, 'generateReceipt'])->where('idOrOrderNumber', '.*');
    Route::get('/{idOrOrderNumber}/receipt', [\App\Http\Controllers\Api\OrderController::class, 'getReceipt'])->where('idOrOrderNumber', '.*');
    Route::match(['put', 'patch'], '/{idOrOrderNumber}/status', [\App\Http\Controllers\Api\OrderController::class, 'updateStatus'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/snap-token', [\App\Http\Controllers\Api\CheckoutController::class, 'getSnapToken'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/confirm-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'confirm'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/approve-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'approve'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/reject-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'reject'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/send-confirmation-email', [\App\Http\Controllers\Api\CheckoutController::class, 'sendConfirmationEmail'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/send-status-email', [\App\Http\Controllers\Api\OrderController::class, 'sendStatusEmail'])->where('idOrOrderNumber', '.*');
    Route::get('/{idOrOrderNumber}', [\App\Http\Controllers\Api\OrderController::class, 'show'])->where('idOrOrderNumber', '.*');
});


Route::get('/payment-methods/manual-banks', [\App\Http\Controllers\Api\ManualPaymentController::class, 'bankAccounts']);
Route::post('/webhooks/midtrans', [\App\Http\Controllers\Api\MidtransWebhookController::class, 'handle']);

Route::prefix('transactions')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
    Route::get('/categories', fn () => response()->json(['data' => \App\Http\Controllers\Api\TransactionController::CATEGORIES]));
    Route::post('/', [\App\Http\Controllers\Api\TransactionController::class, 'store']);
    Route::get('/{idOrTransactionNumber}', [\App\Http\Controllers\Api\TransactionController::class, 'show'])->where('idOrTransactionNumber', '.*');
});

Route::prefix('inventory')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\InventoryController::class, 'index']);
    Route::get('/low-stock', [\App\Http\Controllers\Api\InventoryController::class, 'lowStockAlerts']);
    Route::get('/mutations', [\App\Http\Controllers\Api\InventoryController::class, 'mutations']);
    Route::post('/add-stock', [\App\Http\Controllers\Api\InventoryController::class, 'addStock']);
    Route::post('/{idOrSku}/add-stock', [\App\Http\Controllers\Api\InventoryController::class, 'addStock']);
    Route::post('/reduce-stock', [\App\Http\Controllers\Api\InventoryController::class, 'reduceStock']);
    Route::post('/{idOrSku}/reduce-stock', [\App\Http\Controllers\Api\InventoryController::class, 'reduceStock']);
    Route::get('/{idOrSku}/mutations', [\App\Http\Controllers\Api\InventoryController::class, 'mutations']);
    Route::get('/{idOrSku}', [\App\Http\Controllers\Api\InventoryController::class, 'show']);
});

Route::prefix('stock')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\InventoryController::class, 'index']);
    Route::get('/alerts', [\App\Http\Controllers\Api\InventoryController::class, 'lowStockAlerts']);
    Route::get('/low-stock', [\App\Http\Controllers\Api\InventoryController::class, 'lowStockAlerts']);
    Route::get('/mutations', [\App\Http\Controllers\Api\InventoryController::class, 'mutations']);
    Route::post('/add', [\App\Http\Controllers\Api\InventoryController::class, 'addStock']);
    Route::post('/{idOrSku}/add', [\App\Http\Controllers\Api\InventoryController::class, 'addStock']);
    Route::post('/reduce', [\App\Http\Controllers\Api\InventoryController::class, 'reduceStock']);
    Route::post('/{idOrSku}/reduce', [\App\Http\Controllers\Api\InventoryController::class, 'reduceStock']);
    Route::get('/{idOrSku}/mutations', [\App\Http\Controllers\Api\InventoryController::class, 'mutations']);
    Route::get('/{idOrSku}', [\App\Http\Controllers\Api\InventoryController::class, 'show']);
});

Route::get('/dashboard/low-stock', [\App\Http\Controllers\Api\InventoryController::class, 'lowStockAlerts']);

Route::prefix('templates/emails')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\EmailTemplateController::class, 'index']);
    Route::post('/reset', [\App\Http\Controllers\Api\EmailTemplateController::class, 'reset']);
    Route::post('/', [\App\Http\Controllers\Api\EmailTemplateController::class, 'store']);
    Route::get('/{idOrKey}', [\App\Http\Controllers\Api\EmailTemplateController::class, 'show']);
    Route::match(['put', 'patch'], '/{idOrKey}', [\App\Http\Controllers\Api\EmailTemplateController::class, 'update']);
});

Route::prefix('templates/receipt')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ReceiptTemplateController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\ReceiptTemplateController::class, 'store']);
    Route::match(['put', 'patch'], '/', [\App\Http\Controllers\Api\ReceiptTemplateController::class, 'store']);
    Route::post('/reset', [\App\Http\Controllers\Api\ReceiptTemplateController::class, 'reset']);
});




