<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Lookup aman untuk identitas "id ATAU kode/nomor".
 *
 * PostgreSQL bersifat strict: membandingkan kolom `id` (bigint) dengan string
 * non-numerik (mis. "INV/20260928/TK/123") melempar SQLSTATE[22P02].
 * Scope ini hanya menambahkan kondisi `id` bila nilainya numerik.
 *
 * Model yang memakai trait ini WAJIB mendefinisikan:
 *   protected string $idOrCodeColumn;          // kolom kode utama
 *   protected array $idOrCodeExtraColumns = []; // kolom kode tambahan (opsional)
 */
trait HasIdOrCodeLookup
{
    public function scopeWhereIdOrCode(Builder $query, mixed $value): Builder
    {
        $column = $this->idOrCodeColumn ?? 'id';
        $extra = $this->idOrCodeExtraColumns ?? [];

        return $query->where(function (Builder $q) use ($value, $column, $extra) {
            $q->where($column, (string) $value);

            foreach ($extra as $extraColumn) {
                $q->orWhere($extraColumn, (string) $value);
            }

            if (is_numeric($value)) {
                $q->orWhere($this->getKeyName(), (int) $value);
            }
        });
    }
}
