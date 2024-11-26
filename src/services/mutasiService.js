import { kyselyDb } from '../db/connection';

// for process create mutasi
export async function findKaryawanByPerner(perner) {
    const karyawan = await kyselyDb
    .selectFrom('karyawan')
        .selectAll()
        .where('perner', '=', perner)
        .execute();

    return karyawan.length > 0 ? karyawan[0] : null; 
}

export async function createMutasi({ perner, unit_baru, sub_unit_baru, posisi_baru }) {
    await kyselyDb
    .insertInto('mutasi')
    .values({
        perner,
        unit_baru,
        sub_unit_baru,
        posisi_baru,
        created_at: new Date() 
    })
    .execute();
}

export async function isDuplicateMutasi(perner, unit_baru, sub_unit_baru) {
    console.log('Checking for duplicates', perner, unit_baru, sub_unit_baru);
    const existingMutasi = await kyselyDb
        .selectFrom('mutasi')
        .selectAll()
        .where('perner', '=', perner)
        .where('unit_baru', '=', unit_baru)
        .where('sub_unit_baru', '=', sub_unit_baru)
        .executeTakeFirst();

    console.log('Existing mutasi:', existingMutasi);

    return !!existingMutasi; 
}

export async function getAllMutasi() {
    try {
    const mutasi = await kyselyDb
        .selectFrom('mutasi')
        .innerJoin('karyawan', 'mutasi.perner', 'karyawan.perner')
        .select([
        'mutasi.id as id',
        'mutasi.perner as perner',
        'karyawan.nama as nama',
        'mutasi.unit_baru as unit_baru',
        'mutasi.sub_unit_baru as sub_unit_baru',
        'mutasi.posisi_baru as posisi_baru',
        'mutasi.status_mutasi as status_mutasi',
        'mutasi.created_at as created_at',
        ])
        .execute();

    return mutasi;
    } catch (error) {
    console.error('Error fetching mutasi data:', error);
    throw new Error('Failed to fetch mutasi data');
    }
}
  
export async function getMutasiDetails(perner) {
    try {
        const result = await kyselyDb
        .selectFrom('mutasi')
            .innerJoin('karyawan', 'mutasi.perner', 'karyawan.perner')  
            .select([
                'mutasi.status_mutasi',

                'karyawan.nama',
                'karyawan.perner',
                'karyawan.unit',
                'karyawan.sub_unit',
                'karyawan.nik_atasan',
                'karyawan.nama_atasan',
                'karyawan.posisi_pekerjaan',
                'mutasi.unit_baru',
                'mutasi.sub_unit_baru',
                'mutasi.posisi_baru',
                'mutasi.status_mutasi',
                'mutasi.created_at',
            ])
            .where('mutasi.perner', '=', perner)  
            .executeTakeFirst();  

        if (!result) {
            throw new Error('Mutasi not found');  
        }
        return result;
    } catch (error) {
        console.error('Error fetching mutasi details:', error);
        throw new Error('Failed to fetch mutasi details');
    }
}

export async function updateMutasiStatus(perner, status, alasan_penolakan) {
    try {
        const result = await kyselyDb
            .updateTable('mutasi') 
            .set({
                status_mutasi: status,  
                alasan_penolakan: alasan_penolakan || null, 
            })
            .where('perner', '=', perner)  
            .returning(['status_mutasi', 'alasan_penolakan'])  
            .executeTakeFirst();  

        if (!result) {
            throw new Error('Mutasi not found or update failed');
        }

        return result;  
    } catch (error) {
        console.error('Error updating mutasi status:', error);
        throw new Error('Failed to update mutasi status');
    }
}

export async function deleteMutasi(perner) {
    try {
        const result = await kyselyDb
            .deleteFrom('mutasi') 
            .where('perner', '=', perner) 
            .returning(['perner'])
            .executeTakeFirst();  

        if (!result) {
            throw new Error('Mutasi not found or delete failed');
        }

        return { message: `Mutasi for perner ${perner} has been successfully deleted.` };
    } catch (error) {
        console.error('Error deleting mutasi:', error);
        throw new Error('Failed to delete mutasi');
    }
}
