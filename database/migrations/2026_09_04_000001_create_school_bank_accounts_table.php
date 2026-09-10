<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_bank_accounts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('school_id')->default(1)->index();
            $table->string('bank_name');
            $table->string('account_name');
            $table->string('account_number');
            $table->string('branch_name')->nullable();
            $table->text('payment_instructions')->nullable();
            $table->string('support_phone')->nullable();
            $table->string('support_email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_bank_accounts');
    }
};
