<?php

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * IdentityCodeService
 *
 * Generator kode identitas model dengan format baku Tusko:
 *   PREFIK/ddmmyyyy/increment
 *
 * Contoh: VND/23092026/001, WH/23092026/001
 *
 * Increment direset per tanggal (per hari) dan dijamin unik terhadap kolom `code`.
 * Model yang kodenya bersifat semantik/referensi (Voucher, Expedition, Attribute,
 * OrderStatus, PaymentStatus) TIDAK memakai generator ini.
 */
class IdentityCodeService
{
    /**
     * Generate kode identitas baku berikutnya untuk sebuah model.
     *
     * @param  class-string<Model>  $modelClass  FQCN model target.
     * @param  string  $prefix  Prefiks identitas (mis. "VND", "WH").
     * @param  string  $column  Nama kolom kode (default "code").
     * @param  CarbonInterface|null  $date  Tanggal acuan (default: sekarang).
     */
    public static function generate(
        string $modelClass,
        string $prefix,
        string $column = 'code',
        ?CarbonInterface $date = null
    ): string {
        $date = $date ?? now();
        $datePart = $date->format('dmY');
        $pattern = $prefix . '/' . $datePart . '/';

        $latest = $modelClass::query()
            ->where($column, 'like', $pattern . '%')
            ->orderByRaw('LENGTH(' . $column . ') DESC, ' . $column . ' DESC')
            ->value($column);

        $next = 1;
        if ($latest) {
            $segments = explode('/', $latest);
            $next = ((int) end($segments)) + 1;
        }

        do {
            $candidate = sprintf('%s%03d', $pattern, $next);
            $next++;
        } while ($modelClass::query()->where($column, $candidate)->exists());

        return $candidate;
    }
}
