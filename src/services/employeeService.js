import { kyselyDb } from '../db/connection';
import { sql } from 'kysely';
// import { karyawan } from '../db/dbSchema';
 
export const getAllKaryawan = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 20; 
    const offset = (page - 1) * pageSize;  

    try {  
        const totalRecords = await kyselyDb
        .selectFrom('karyawan')
        .select([sql`count(*) as total_count`])
        .executeTakeFirst();

        const karyawanList = await kyselyDb  
            .selectFrom('karyawan')   
            .select(['perner', 'nama', 'take_home_pay', 'unit', 'sub_unit', 'posisi_pekerjaan', 'sumber_anggaran'])
            .orderBy('perner', 'asc')  
            .limit(pageSize)
            .offset(offset)  
            .execute();
        
        const totalPages = Math.ceil(totalRecords.total_count / pageSize);

        return {
            currentPage: page,
            totalPages,
            totalRecords: totalRecords.total_count,
            data: karyawanList
        };    
    } catch (error) {  
        console.error('Error fetching karyawan:', error);  
        res.status(500).json({ error: 'Failed to fetch karyawan data' }); 
    }  
};  

export const getKaryawanById = async (perner) => {
    try {
        const karyawan = await kyselyDb
            .selectFrom('karyawan')
            .select([
                'perner',
                'status_karyawan', 
                'nama', 
                'jenis_kelamin', 
                'status_pernikahan', 
                'jumlah_anak', 
                'posisi_pekerjaan', 
                'kategori_posisi', 
                'unit', 
                'sub_unit', 
                'kota', 
                'nik_atasan', 
                'nama_atasan', 
                'sumber_anggaran', 
                'skema_umk', 
                'gaji_pokok', 
                'tunjangan_operasional', 
                'pph_21', 
                'take_home_pay', 
                'tunjangan_hari_raya', 
                'gaji_kotor', 
                'pajak_penghasilan', 
                'thp_gross_pph_21', 
                'uang_kehadiran', 
                'bpjs_ketenagakerjaan', 
                'bpjs_kesehatan', 
                'perlindungan_asuransi', 
                'tunjangan_ekstra', 
                'invoice_bulanan', 
                'invoice_kontrak', 
                'tunjangan_lainnya',
                'bergabung_sejak',
            ])
            .where('perner', '=', perner)
            .executeTakeFirst(); 
        
        if (!karyawan) {
            throw new Error(`Karyawan with perner ${perner} not found`);
        }

        return karyawan;
    } catch (error) {
        console.error(`Error fetching karyawan with perner ${perner}:`, error);
        throw new Error('Failed to fetch karyawan data');
    }
};

export const filterKaryawanByUnits = async (units) => {
    const validUnits = [
        "Kantor Telkom Regional III",
        "Witel Suramadu",
        "Witel Jatim Timur",
        "Witel Jatim Barat",
        "Witel Bali",
        "Witel Nusa Tenggara",
        "Witel Semarang Jateng Utara",
        "Witel Yogya Jateng Selatan",
        "Witel Solo Jateng Timur"
    ];

    // Pisahkan string units menjadi array dan validasi
    const unitsArray = units.split(',').map(unit => unit.trim());
    const invalidUnits = unitsArray.filter(unit => !validUnits.includes(unit));

    if (invalidUnits.length > 0) {
        throw new Error(`Unit tidak valid: ${invalidUnits.join(', ')}`);
    }

    try {
        const karyawanList = await kyselyDb
            .selectFrom('karyawan')
            .select([
                'perner', 'nama', 'take_home_pay',
                'unit', 'sub_unit', 'posisi_pekerjaan',
                'sumber_anggaran'
            ])
            .where('unit', 'in', unitsArray)
            .orderBy('perner', 'asc')
            .execute();

        if (karyawanList.length === 0) {
            throw new Error(`Tidak ada data karyawan untuk unit: ${unitsArray.join(', ')}`);
        }

        const totalPerUnit = unitsArray.reduce((acc, unit) => {
            acc[unit] = karyawanList.filter(karyawan => karyawan.unit === unit).length;
            return acc;
        }, {});

        return { karyawanList, totalPerUnit };
    } catch (error) {
        console.error(`Error filtering karyawan by units "${units}":`, error);
        throw error;
    }
};

// for mutasi
export const getKaryawanDetails = async (nama) => {
    const result = await kyselyDb
      .selectFrom('karyawan')
      .select([
        'perner', 
        'nama', 
        'unit',
        'sub_unit',
        'kota',
        'nik_atasan',
        'nama_atasan',
        'posisi_pekerjaan'
      ])
      .where('nama', 'ilike', `%${nama}%`) 
      .execute(); 
  
    if (!result) {
      throw new Error('Karyawan tidak ditemukan');
    }
  
    return result;
};