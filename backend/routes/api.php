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
    Route::get('/categories', [\App\Http\Controllers\Api\ExpeditionController::class, 'categories']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ExpeditionController::class, 'show']);
});

Route::post('/checkout', [\App\Http\Controllers\Api\CheckoutController::class, 'checkout']);
Route::prefix('orders')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\CheckoutController::class, 'index']);
    Route::get('/{idOrOrderNumber}', [\App\Http\Controllers\Api\CheckoutController::class, 'show'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/snap-token', [\App\Http\Controllers\Api\CheckoutController::class, 'getSnapToken'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/confirm-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'confirm'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/approve-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'approve'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/reject-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'reject'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/send-confirmation-email', [\App\Http\Controllers\Api\CheckoutController::class, 'sendConfirmationEmail'])->where('idOrOrderNumber', '.*');
});

Route::get('/payment-methods/manual-banks', [\App\Http\Controllers\Api\ManualPaymentController::class, 'bankAccounts']);
Route::post('/webhooks/midtrans', [\App\Http\Controllers\Api\MidtransWebhookController::class, 'handle']);


