<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_category_with_slug(): void
    {
        $category = Category::create([
            'name' => 'Elektronik Rumah',
            'slug' => 'elektronik-rumah',
        ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Elektronik Rumah',
            'slug' => 'elektronik-rumah',
            'parent_id' => null,
        ]);
    }

    public function test_can_create_child_category(): void
    {
        $parent = Category::create([
            'name' => 'Komputer & Laptop',
            'slug' => 'komputer-laptop',
        ]);

        $child = Category::create([
            'name' => 'Aksesoris Komputer',
            'slug' => 'aksesoris-komputer',
            'parent_id' => $parent->id,
        ]);

        $this->assertEquals($parent->id, $child->parent->id);
        $this->assertTrue($parent->children->contains($child));
    }
}
