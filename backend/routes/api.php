<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\GoodsReceivingNoteController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\VendorBillController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::get('/{idOrSlug}', [CategoryController::class, 'show']);
    Route::match(['put', 'patch'], '/{idOrSlug}', [CategoryController::class, 'update']);
    Route::delete('/{idOrSlug}', [CategoryController::class, 'destroy']);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');
    Route::get('/menus', [MenuController::class, 'forUser'])->middleware('auth.optional');
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::match(['put', 'patch'], '/profile', [AuthController::class, 'updateProfile']);
        Route::post('/password', [AuthController::class, 'updatePassword']);
        Route::get('/sessions', [AuthController::class, 'getActiveSessions']);
        Route::delete('/sessions/other', [AuthController::class, 'revokeOtherSessions']);
        Route::delete('/sessions/{id}', [AuthController::class, 'revokeSession']);
    });
});

Route::prefix('loyalty')->middleware('auth:sanctum')->group(function () {
    Route::get('/ledger', [\App\Http\Controllers\Api\LoyaltyController::class, 'ledger']);
});

Route::prefix('vouchers')->group(function () {
    Route::get('/', [VoucherController::class, 'index']);
    Route::post('/validate', [VoucherController::class, 'validateVoucher'])->middleware('auth.optional');
    Route::post('/claim', [VoucherController::class, 'claim'])->middleware('auth:sanctum');
});

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::post('/', [ProductController::class, 'store']);
    Route::post('/upload-image', [ProductController::class, 'uploadImage']);
    Route::match(['put', 'patch'], '/{idOrSlug}', [ProductController::class, 'update']);
    Route::delete('/{idOrSlug}', [ProductController::class, 'destroy']);
    Route::post('/{idOrSlug}/toggle-status', [ProductController::class, 'toggleStatus']);
    Route::get('/{idOrSlug}/reviews', [\App\Http\Controllers\Api\ProductReviewController::class, 'indexForProduct']);
    Route::get('/{idOrSlug}', [ProductController::class, 'show']);
});
Route::post('/upload', [ProductController::class, 'uploadImage']);

Route::prefix('cart')->middleware('auth.optional')->group(function () {
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
});


Route::post('/checkout', [\App\Http\Controllers\Api\CheckoutController::class, 'checkout'])->middleware('auth.optional');
Route::get('/checkout/config', [\App\Http\Controllers\Api\CheckoutController::class, 'config'])->middleware('auth.optional');
Route::get('/shipping/rates', [\App\Http\Controllers\Api\ShippingRateController::class, 'index'])->middleware('auth.optional');
Route::get('/shipping/services', [\App\Http\Controllers\Api\ShippingRateController::class, 'localServices'])->middleware('auth.optional');

Route::prefix('locations')->group(function () {
    Route::get('/provinces', [\App\Http\Controllers\Api\LocationController::class, 'provinces']);
    Route::get('/cities', [\App\Http\Controllers\Api\LocationController::class, 'cities']);
    Route::get('/districts', [\App\Http\Controllers\Api\LocationController::class, 'districts']);
    Route::get('/subdistricts', [\App\Http\Controllers\Api\LocationController::class, 'subdistricts']);
});
Route::prefix('orders')->middleware('auth.optional')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\OrderController::class, 'index']);
    Route::get('/track/{orderNumber}', [\App\Http\Controllers\Api\OrderController::class, 'trackGuestOrder'])->where('orderNumber', '.*');
    Route::post('/{idOrOrderNumber}/generate-receipt', [\App\Http\Controllers\Api\OrderController::class, 'generateReceipt'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/book-pickup', [\App\Http\Controllers\Api\OrderController::class, 'bookPickup'])->where('idOrOrderNumber', '.*');
    Route::get('/{idOrOrderNumber}/receipt', [\App\Http\Controllers\Api\OrderController::class, 'getReceipt'])->where('idOrOrderNumber', '.*');
    Route::match(['put', 'patch'], '/{idOrOrderNumber}/status', [\App\Http\Controllers\Api\OrderController::class, 'updateStatus'])->where('idOrOrderNumber', '.*');
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/{idOrOrderNumber}/cancel', [\App\Http\Controllers\Api\OrderController::class, 'cancel'])->where('idOrOrderNumber', '.*');
        Route::post('/{idOrOrderNumber}/complete', [\App\Http\Controllers\Api\OrderController::class, 'complete'])->where('idOrOrderNumber', '.*');
    });
    Route::post('/{idOrOrderNumber}/snap-token', [\App\Http\Controllers\Api\CheckoutController::class, 'getSnapToken'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/confirm-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'confirm'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/approve-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'approve'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/reject-payment', [\App\Http\Controllers\Api\ManualPaymentController::class, 'reject'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/send-confirmation-email', [\App\Http\Controllers\Api\CheckoutController::class, 'sendConfirmationEmail'])->where('idOrOrderNumber', '.*');
    Route::post('/{idOrOrderNumber}/send-status-email', [\App\Http\Controllers\Api\OrderController::class, 'sendStatusEmail'])->where('idOrOrderNumber', '.*');
    Route::get('/{idOrOrderNumber}', [\App\Http\Controllers\Api\OrderController::class, 'show'])->where('idOrOrderNumber', '.*');
});


Route::get('/payment-methods', [\App\Http\Controllers\Api\PaymentMethodController::class, 'index']);
Route::get('/payment-methods/manual-banks', [\App\Http\Controllers\Api\ManualPaymentController::class, 'bankAccounts']);
Route::post('/webhooks/midtrans', [\App\Http\Controllers\Api\MidtransWebhookController::class, 'handle']);

Route::prefix('transactions')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
    Route::get('/categories', fn () => response()->json(['data' => \App\Http\Controllers\Api\TransactionController::CATEGORIES]));
    Route::post('/', [\App\Http\Controllers\Api\TransactionController::class, 'store']);
    Route::get('/{idOrTransactionNumber}', [\App\Http\Controllers\Api\TransactionController::class, 'show'])->where('idOrTransactionNumber', '.*');
});

Route::get('/journal-entries', [\App\Http\Controllers\Api\JournalEntryController::class, 'index']);

Route::get('/reports/profit', [\App\Http\Controllers\Api\ReportController::class, 'profit']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/reviews', [\App\Http\Controllers\Api\ProductReviewController::class, 'store']);

    Route::prefix('returns')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ReturnController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\ReturnController::class, 'store']);
        Route::get('/{idOrNumber}', [\App\Http\Controllers\Api\ReturnController::class, 'show'])->where('idOrNumber', '.*');
    });
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/reports/income-statement', [\App\Http\Controllers\Api\ReportController::class, 'incomeStatement']);
    Route::get('/reports/trial-balance', [\App\Http\Controllers\Api\ReportController::class, 'trialBalance']);
    Route::get('/reports/vendor-aging', [\App\Http\Controllers\Api\ReportController::class, 'vendorAging']);

    Route::get('/dashboard/summary', [\App\Http\Controllers\Api\DashboardController::class, 'summary']);

    Route::post('/admin/expeditions/sync', [\App\Http\Controllers\Api\ExpeditionController::class, 'sync']);

    Route::prefix('admin/reviews')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ProductReviewController::class, 'adminIndex']);
        Route::match(['put', 'patch'], '/{review}/moderate', [\App\Http\Controllers\Api\ProductReviewController::class, 'moderate']);
        Route::delete('/{review}', [\App\Http\Controllers\Api\ProductReviewController::class, 'destroy']);
    });

    Route::post('/returns/{idOrNumber}/approve', [\App\Http\Controllers\Api\ReturnController::class, 'approve'])->where('idOrNumber', '.*');
    Route::post('/returns/{idOrNumber}/reject', [\App\Http\Controllers\Api\ReturnController::class, 'reject'])->where('idOrNumber', '.*');
    Route::post('/returns/{idOrNumber}/refund', [\App\Http\Controllers\Api\ReturnController::class, 'refund'])->where('idOrNumber', '.*');
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/integrations', [\App\Http\Controllers\Api\IntegrationController::class, 'index']);
    Route::put('/integrations', [\App\Http\Controllers\Api\IntegrationController::class, 'update']);

    Route::prefix('admin/vouchers')->group(function () {
        Route::get('/', [VoucherController::class, 'adminIndex']);
        Route::post('/', [VoucherController::class, 'store']);
        Route::get('/{id}', [VoucherController::class, 'show'])->whereNumber('id');
        Route::match(['put', 'patch'], '/{id}', [VoucherController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [VoucherController::class, 'destroy'])->whereNumber('id');
    });

    Route::middleware(['menu.access:/admin/settings', 'throttle:120,1'])->group(function () {
        Route::get('/admin/settings', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
        Route::get('/admin/settings/{group}', [\App\Http\Controllers\Api\SettingsController::class, 'show']);
        Route::put('/admin/settings/{group}', [\App\Http\Controllers\Api\SettingsController::class, 'update']);
        Route::post('/admin/settings/{group}/test-connection', [\App\Http\Controllers\Api\SettingsController::class, 'testConnection']);
    });

    // Kelola master menu & akses role (T37.6) — superuser `admin`.
    Route::prefix('admin/menus')->group(function () {
        Route::get('/role-options', [MenuController::class, 'roleOptions']);
        Route::get('/', [MenuController::class, 'index']);
        Route::post('/', [MenuController::class, 'store']);
        Route::get('/{menu}', [MenuController::class, 'show']);
        Route::match(['put', 'patch'], '/{menu}', [MenuController::class, 'update']);
        Route::delete('/{menu}', [MenuController::class, 'destroy']);
        Route::post('/{menu}/toggle-status', [MenuController::class, 'toggleStatus']);
    });

    // Kelola akun pengguna (T38.1) — superuser `admin`.
    Route::prefix('admin/users')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\UserController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\UserController::class, 'store']);
        Route::get('/{user}', [\App\Http\Controllers\Api\UserController::class, 'show']);
        Route::match(['put', 'patch'], '/{user}', [\App\Http\Controllers\Api\UserController::class, 'update']);
        Route::delete('/{user}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);
        Route::post('/{user}/roles', [\App\Http\Controllers\Api\UserController::class, 'syncRoles']);
    });

    // Master Role (T24.3) — superuser `admin`.
    Route::prefix('admin/roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::post('/', [RoleController::class, 'store']);
        Route::get('/{role}', [RoleController::class, 'show']);
        Route::match(['put', 'patch'], '/{role}', [RoleController::class, 'update']);
        Route::delete('/{role}', [RoleController::class, 'destroy']);
        Route::get('/{role}/menus', [RoleController::class, 'menus']);
        Route::put('/{role}/menus', [RoleController::class, 'syncMenus']);
    });
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

Route::prefix('stock-transfers')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\StockTransferController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\StockTransferController::class, 'store']);
    Route::get('/{idOrNumber}', [\App\Http\Controllers\Api\StockTransferController::class, 'show'])->where('idOrNumber', '.*');
    Route::post('/{idOrNumber}/approve', [\App\Http\Controllers\Api\StockTransferController::class, 'approve'])->where('idOrNumber', '.*');
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('stock-opnames')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\StockOpnameController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\StockOpnameController::class, 'store']);
    Route::get('/{idOrNumber}', [\App\Http\Controllers\Api\StockOpnameController::class, 'show'])->where('idOrNumber', '.*');
    Route::post('/{idOrNumber}/submit', [\App\Http\Controllers\Api\StockOpnameController::class, 'submit'])->where('idOrNumber', '.*');
    Route::post('/{idOrNumber}/approve', [\App\Http\Controllers\Api\StockOpnameController::class, 'approve'])->where('idOrNumber', '.*');
});

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
    Route::post('/reset', [\App\Http\Controllers\Api\ReceiptTemplateController::class, 'reset']);
});

Route::prefix('vendors')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\VendorController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\VendorController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\VendorController::class, 'show']);
    Route::match(['put', 'patch'], '/{id}', [\App\Http\Controllers\Api\VendorController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\VendorController::class, 'destroy']);
    Route::post('/{id}/toggle-status', [\App\Http\Controllers\Api\VendorController::class, 'toggleStatus']);
});

Route::prefix('purchase-orders')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'store']);
    Route::get('/{idOrPoNumber}', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'show']);
    Route::post('/{idOrPoNumber}/approve', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'approve']);
    Route::post('/{idOrPoNumber}/receive', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'receive']);
    Route::post('/{idOrPoNumber}/cancel', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'cancel']);
});

Route::prefix('goods-receiving-notes')->group(function () {
    Route::get('/', [GoodsReceivingNoteController::class, 'index']);
    Route::get('/next-number', [GoodsReceivingNoteController::class, 'nextDeliveryOrderNumber']);
    Route::get('/{id}', [GoodsReceivingNoteController::class, 'show']);
});

Route::prefix('vendor-bills')->group(function () {
    Route::get('/', [VendorBillController::class, 'index']);
    Route::get('/{id}', [VendorBillController::class, 'show']);
    Route::get('/{id}/payments', [VendorBillController::class, 'payments']);
    Route::get('/{id}/invoice-url', [VendorBillController::class, 'invoiceUrl']);
    Route::post('/{id}/payments', [VendorBillController::class, 'storePayment']);
    Route::delete('/{id}/payments/{paymentId}', [VendorBillController::class, 'destroyPayment']);
});

Route::prefix('warehouses')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\WarehouseController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\WarehouseController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\WarehouseController::class, 'show']);
    Route::match(['put', 'patch'], '/{id}', [\App\Http\Controllers\Api\WarehouseController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\WarehouseController::class, 'destroy']);
    Route::post('/{id}/toggle-status', [\App\Http\Controllers\Api\WarehouseController::class, 'toggleStatus']);
    Route::get('/{idOrCode}/bins', [\App\Http\Controllers\Api\WarehouseBinController::class, 'index']);
    Route::post('/{idOrCode}/bins', [\App\Http\Controllers\Api\WarehouseBinController::class, 'store']);
    Route::match(['put', 'patch'], '/{idOrCode}/bins/{binId}', [\App\Http\Controllers\Api\WarehouseBinController::class, 'update']);
    Route::delete('/{idOrCode}/bins/{binId}', [\App\Http\Controllers\Api\WarehouseBinController::class, 'destroy']);
});

