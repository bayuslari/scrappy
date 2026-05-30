# DAMA Adelaide Job Scraper

Script Python untuk scraping lowongan kerja frontend/fullstack developer di Adelaide dari Indeed, LinkedIn, dan Glassdoor — dengan filter otomatis untuk visa sponsorship likelihood.

---

## Requirements

```bash
pip install python-jobspy pandas openpyxl
```

---

## Cara Pakai

```bash
python dama_adelaide_job_scraper.py
```

Script akan otomatis berjalan dan menghasilkan dua file output di folder yang sama.

---

## Output

| File | Keterangan |
|---|---|
| `dama_jobs_YYYYMMDD.csv` | Semua hasil mentah |
| `dama_jobs_YYYYMMDD.xlsx` | Color-coded, siap review |

### Color coding di XLSX

| Warna | Label | Artinya |
|---|---|---|
| 🟢 Hijau | ✅ Likely | Ada keyword: `visa sponsor`, `sponsorship`, `relocation`, `482`, dll |
| 🟡 Kuning | 🔶 Unknown | Tidak menyebut sponsorship — perlu di-approach manual |
| 🔴 Merah | ❌ No | Explicitly exclude: `Australian citizen only`, `no sponsorship`, dll |

---

## Konfigurasi

Edit bagian `# config` di atas script sesuai kebutuhan:

```python
SITES         = ["indeed", "linkedin", "glassdoor"]  # hapus yang sering gagal
RESULTS_EACH  = 30       # jumlah hasil per query per site
MAX_AGE_DAYS  = 30       # filter umur posting (hari)
DELAY_BETWEEN = 3        # jeda antar request (detik) — jangan terlalu kecil
OUTPUT_DIR    = Path(".") # folder output, bisa diganti misal Path("~/jobs")
```

### Search queries

Script menjalankan beberapa query sekaligus untuk memaksimalkan coverage:

- `React developer`
- `Frontend developer React`
- `Frontend engineer TypeScript`
- `Full stack developer React`
- `JavaScript developer`
- `Next.js developer`
- `Web developer React`

Tambah atau kurangi di list `SEARCH_QUERIES` sesuai target role kamu.

### Tech keywords

Digunakan untuk menghitung `tech_score` per job (makin tinggi = makin relevan):

```python
TECH_KEYWORDS = [
    "react", "next.js", "nextjs", "typescript", "javascript",
    "tailwind", "vue", "angular", "node.js", "supabase",
    "graphql", "rest api",
]
```

---

## Catatan Penting

> Kebanyakan employer DAMA **tidak explicitly mention "DAMA"** di job listing. Mereka posting seperti biasa di job board umum.

Script ini menangkap **sinyal tidak langsung** dari deskripsi job. Untuk konfirmasi apakah employer bisa sponsor 482 TSS, kamu tetap perlu reach out langsung via email setelah menemukan kandidat employer yang menarik.

### Positive signals yang dideteksi

`visa sponsor` · `sponsorship` · `work rights` · `right to work` · `DAMA` · `skilled migration` · `482` · `TSS visa` · `employer sponsored` · `relocation`

### Negative signals yang dideteksi

`must be australian citizen` · `no sponsorship` · `must have full working rights` · `security clearance` · `NV1/NV2`

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| LinkedIn 403 error | Hapus `"linkedin"` dari `SITES` — LinkedIn sering block scraper |
| 0 jobs found | Coba jalankan ulang; job boards kadang rate-limit |
| XLSX save failed | Install openpyxl: `pip install openpyxl` |
| Terlalu banyak hasil tidak relevan | Perkecil `RESULTS_EACH` atau tambah keyword spesifik di `SEARCH_QUERIES` |
