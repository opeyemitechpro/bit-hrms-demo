<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create("roles", function (Blueprint $table) {
            $table->id();
            $table->string("name");
            $table->string("code", 50)->unique();
            $table->text("description")->nullable();
            $table->timestamps();
        });

        Schema::create("permissions", function (Blueprint $table) {
            $table->id();
            $table->string("name");
            $table->string("code", 50)->unique();
            $table->timestamps();
        });

        Schema::create("departments", function (Blueprint $table) {
            $table->id();
            $table->string("name")->unique();
            $table->string("code", 50)->unique();
            $table->text("description")->nullable();
            $table->boolean("is_active")->default(true);
            $table->timestamps();
        });

        Schema::create("units", function (Blueprint $table) {
            $table->id();
            $table->foreignId("department_id")->constrained("departments")->onDelete("cascade");
            $table->string("name");
            $table->string("code", 50);
            $table->boolean("is_active")->default(true);
            $table->timestamps();
        });

        Schema::create("grade_levels", function (Blueprint $table) {
            $table->id();
            $table->string("name", 50)->unique();
            $table->integer("level_number")->index();
            $table->integer("min_step")->default(1);
            $table->integer("max_step")->default(15);
            $table->string("salary_structure", 50)->default("CONPSS");
            $table->text("description")->nullable();
            $table->boolean("is_active")->default(true);
            $table->timestamps();
        });

        Schema::create("designations", function (Blueprint $table) {
            $table->id();
            $table->string("name")->unique();
            $table->string("code", 50)->unique();
            $table->string("cadre_name")->nullable();
            $table->timestamps();
        });

        Schema::create("employment_statuses", function (Blueprint $table) {
            $table->id();
            $table->string("name", 50)->unique();
            $table->string("code", 30)->unique();
            $table->boolean("is_active_nominal")->default(true);
            $table->timestamps();
        });

        Schema::create("staff", function (Blueprint $table) {
            $table->id();
            $table->string("staff_number", 50)->unique()->index();
            $table->string("ogun_employee_number", 50)->unique()->nullable();
            $table->string("file_number", 50)->nullable();
            $table->string("ippis_number", 50)->nullable();
            $table->string("title", 20)->default("Mr.");
            $table->string("surname", 100)->index();
            $table->string("first_name", 100)->index();
            $table->string("middle_name", 100)->nullable();
            $table->enum("gender", ["Male", "Female"]);
            $table->date("date_of_birth");
            $table->string("official_email", 150)->unique();
            $table->string("phone_number", 30)->nullable();
            $table->string("personal_email", 150)->nullable();
            $table->string("place_of_birth", 150)->nullable();
            $table->string("state_of_origin", 100)->nullable();
            $table->string("lga_of_origin", 100)->nullable();
            $table->text("residential_address")->nullable();
            $table->string("photo_path", 255)->nullable();
            $table->foreignId("department_id")->constrained("departments");
            $table->foreignId("unit_id")->constrained("units");
            $table->foreignId("designation_id")->constrained("designations");
            $table->foreignId("grade_level_id")->constrained("grade_levels");
            $table->integer("step")->default(1);
            $table->foreignId("employment_status_id")->constrained("employment_statuses");
            $table->date("date_of_first_appointment");
            $table->date("date_of_present_appointment");
            $table->date("date_of_confirmation")->nullable();
            $table->date("date_of_last_promotion")->nullable();
            $table->date("date_of_last_deployment")->nullable();
            $table->date("expected_retirement_date")->index();
            $table->string("current_station", 150)->default("BIT Headquarters, Abeokuta");
            $table->unsignedBigInteger("supervisor_id")->nullable();
            $table->text("remarks")->nullable();
            $table->unsignedBigInteger("created_by")->nullable();
            $table->unsignedBigInteger("updated_by")->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create("users", function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger("staff_id")->nullable();
            $table->string("name");
            $table->string("username", 100)->unique();
            $table->string("email", 150)->unique();
            $table->string("password");
            $table->foreignId("role_id")->constrained("roles");
            $table->unsignedBigInteger("department_id")->nullable();
            $table->enum("status", ["active", "suspended", "inactive"])->default("active");
            $table->timestamp("last_login_at")->nullable();
            $table->string("last_login_ip", 45)->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create("audit_logs", function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger("user_id")->nullable();
            $table->string("username", 100);
            $table->string("action", 100)->index();
            $table->string("module", 50)->index();
            $table->string("record_type", 100)->nullable();
            $table->unsignedBigInteger("record_id")->nullable();
            $table->json("previous_values")->nullable();
            $table->json("new_values")->nullable();
            $table->string("ip_address", 45)->nullable();
            $table->text("user_agent")->nullable();
            $table->timestamp("created_at")->index();
        });
    }

    public function down(): void {
        Schema::dropIfExists("audit_logs");
        Schema::dropIfExists("users");
        Schema::dropIfExists("staff");
        Schema::dropIfExists("employment_statuses");
        Schema::dropIfExists("designations");
        Schema::dropIfExists("grade_levels");
        Schema::dropIfExists("units");
        Schema::dropIfExists("departments");
        Schema::dropIfExists("permissions");
        Schema::dropIfExists("roles");
    }
};
