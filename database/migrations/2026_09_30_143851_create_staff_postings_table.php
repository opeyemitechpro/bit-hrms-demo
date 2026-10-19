<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('staff_postings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->string('station_name', 190);
            $table->string('mda_name', 190)->nullable();
            $table->string('deployment_type', 50)->default('POSTED'); // HEADQUARTERS, POSTED, SECONDED, RECALLED, INTERNAL_TRANSFER
            $table->date('effective_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(true);
            $table->string('circular_reference', 100)->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_postings');
    }
};
