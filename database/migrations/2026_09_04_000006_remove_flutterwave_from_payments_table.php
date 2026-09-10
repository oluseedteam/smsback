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
        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'flutterwave_tx_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn('flutterwave_tx_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('payments') && !Schema::hasColumn('payments', 'flutterwave_tx_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->string('flutterwave_tx_id')->nullable();
            });
        }
    }
};
