<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Designation;

class DesignationSeeder extends Seeder
{
    public function run(): void
    {
        $desigs = [
            // Political / Special Appointees
            ["name" => "Special Adviser (ICT)", "code" => "SA-ICT", "cadre_name" => "Special Appointee"],
            ["name" => "Senior Special Assistant (ICT)", "code" => "SSA-ICT", "cadre_name" => "Special Appointee"],
            ["name" => "Consultant (ICT)", "code" => "CONS-ICT", "cadre_name" => "Special Appointee"],

            // Administrative Officer Cadre
            ["name" => "Deputy Director, Admin. & Supplies", "code" => "DD-ADM", "cadre_name" => "Administrative Officer Cadre"],
            ["name" => "Assistant Director, Admin. & Supplies", "code" => "AD-ADM", "cadre_name" => "Administrative Officer Cadre"],
            ["name" => "Chief Administrative Officer", "code" => "CAO-14", "cadre_name" => "Administrative Officer Cadre"],
            ["name" => "Assistant Chief Administrative Officer", "code" => "ACAO-13", "cadre_name" => "Administrative Officer Cadre"],
            ["name" => "Principal Administrative Officer", "code" => "PAO-12", "cadre_name" => "Administrative Officer Cadre"],
            ["name" => "Senior Administrative Officer", "code" => "SAO-10", "cadre_name" => "Administrative Officer Cadre"],
            ["name" => "Administrative Officer I", "code" => "AO1-09", "cadre_name" => "Administrative Officer Cadre"],
            ["name" => "Administrative Officer II", "code" => "AO2-08", "cadre_name" => "Administrative Officer Cadre"],

            // Executive Officer (GD) Cadre
            ["name" => "Assistant Chief Executive Officer (GD)", "code" => "ACEO-GD-13", "cadre_name" => "Executive Officer (GD) Cadre"],
            ["name" => "Principal Executive Officer I (GD)", "code" => "PEO1-GD-12", "cadre_name" => "Executive Officer (GD) Cadre"],
            ["name" => "Principal Executive Officer II (GD)", "code" => "PEO2-GD-10", "cadre_name" => "Executive Officer (GD) Cadre"],
            ["name" => "Senior Executive Officer (GD)", "code" => "SEO-GD-09", "cadre_name" => "Executive Officer (GD) Cadre"],
            ["name" => "Higher Executive Officer (GD)", "code" => "HEO-GD-08", "cadre_name" => "Executive Officer (GD) Cadre"],
            ["name" => "Executive Officer (GD)", "code" => "EO-GD-07", "cadre_name" => "Executive Officer (GD) Cadre"],

            // Confidential Secretary Cadre
            ["name" => "Principal Confidential Secretary", "code" => "PCS-10", "cadre_name" => "Confidential Secretary Officer Cadre"],
            ["name" => "Senior Confidential Secretary", "code" => "SCS-09", "cadre_name" => "Confidential Secretary Officer Cadre"],
            ["name" => "Higher Confidential Secretary", "code" => "HCS-08", "cadre_name" => "Confidential Secretary Officer Cadre"],

            // Accountant Officer Cadre
            ["name" => "Assistant Chief Accountant", "code" => "ACA-13", "cadre_name" => "Accountant Officer Cadre"],
            ["name" => "Principal Accountant", "code" => "PA-12", "cadre_name" => "Accountant Officer Cadre"],
            ["name" => "Senior Accountant", "code" => "SA-10", "cadre_name" => "Accountant Officer Cadre"],
            ["name" => "Accountant I", "code" => "ACC1-09", "cadre_name" => "Accountant Officer Cadre"],
            ["name" => "Accountant II", "code" => "ACC2-08", "cadre_name" => "Accountant Officer Cadre"],

            // Executive Officer (Accounts) Cadre
            ["name" => "Chief Executive Officer (Accounts)", "code" => "CEO-AC-14", "cadre_name" => "Executive Officer (A/C) Cadre"],
            ["name" => "Assistant Chief Executive Officer (Accounts)", "code" => "ACEO-AC-13", "cadre_name" => "Executive Officer (A/C) Cadre"],
            ["name" => "Principal Executive Officer II (Accounts)", "code" => "PEO2-AC-10", "cadre_name" => "Executive Officer (A/C) Cadre"],
            ["name" => "Senior Executive Officer (Accounts)", "code" => "SEO-AC-09", "cadre_name" => "Executive Officer (A/C) Cadre"],
            ["name" => "Higher Executive Officer (Accounts)", "code" => "HEO-AC-08", "cadre_name" => "Executive Officer (A/C) Cadre"],
            ["name" => "Executive Officer (Accounts)", "code" => "EO-AC-07", "cadre_name" => "Executive Officer (A/C) Cadre"],

            // Programme Analyst Officer Cadre
            ["name" => "Director of Software Engineering / IT", "code" => "DIR-SWE", "cadre_name" => "Programme Analyst Officer Cadre"],
            ["name" => "Assistant Director, Programme Analyst", "code" => "AD-PA-15", "cadre_name" => "Programme Analyst Officer Cadre"],
            ["name" => "Chief Programme Analyst", "code" => "CPA-14", "cadre_name" => "Programme Analyst Officer Cadre"],
            ["name" => "Assistant Chief Programme Analyst", "code" => "ACPA-13", "cadre_name" => "Programme Analyst Officer Cadre"],
            ["name" => "Principal Programme Analyst", "code" => "PPA-12", "cadre_name" => "Programme Analyst Officer Cadre"],
            ["name" => "Senior Programme Analyst", "code" => "SPA-10", "cadre_name" => "Programme Analyst Officer Cadre"],
            ["name" => "Programme Analyst I", "code" => "PA1-09", "cadre_name" => "Programme Analyst Officer Cadre"],
            ["name" => "Programme Analyst II", "code" => "PA2-08", "cadre_name" => "Programme Analyst Officer Cadre"],

            // Data Processing Officer Cadre
            ["name" => "Chief Data Processing Officer", "code" => "CDPO-14", "cadre_name" => "Data Processing Officer Cadre"],
            ["name" => "Assistant Chief Data Processing Officer", "code" => "ACDPO-13", "cadre_name" => "Data Processing Officer Cadre"],
            ["name" => "Principal Data Processing Officer", "code" => "PDPO-12", "cadre_name" => "Data Processing Officer Cadre"],
            ["name" => "Senior Data Processing Officer", "code" => "SDPO-10", "cadre_name" => "Data Processing Officer Cadre"],
            ["name" => "Higher Data Processing Officer", "code" => "HDPO-08", "cadre_name" => "Data Processing Officer Cadre"],
            ["name" => "Data Processing Officer", "code" => "DPO-07", "cadre_name" => "Data Processing Officer Cadre"],
        ];
        foreach ($desigs as $d) {
            Designation::updateOrCreate(["code" => $d["code"]], $d);
        }
    }
}
