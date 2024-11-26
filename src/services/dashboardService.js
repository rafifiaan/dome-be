import { kyselyDb } from '../db/connection';
import { sql } from 'kysely';

export const getDashboardSummary = async () => {
    try {
        const totalActiveEmployees = await kyselyDb
            .selectFrom('karyawan')
            .select(kyselyDb.fn.count('status_karyawan').as('karyawan_aktif'))
            .where('status_karyawan', '=', 'Aktif')
            .executeTakeFirst();

        const totalEmployees = await kyselyDb
            .selectFrom('karyawan')
            .select(kyselyDb.fn.count('perner').as('total_karyawan'))
            .executeTakeFirst();

        const employeeGenderCounts = await kyselyDb
            .selectFrom('karyawan')
            .select([
                'jenis_kelamin',
                kyselyDb.fn.count('jenis_kelamin').as('count'),
            ])
            .groupBy('jenis_kelamin')
            .execute();

        const employeeAgeCounts = await kyselyDb
            .selectFrom('karyawan')
            .select([
                sql`CASE 
                        WHEN usia BETWEEN 21 AND 30 THEN '21-30'
                        WHEN usia BETWEEN 31 AND 40 THEN '31-40'
                        WHEN usia BETWEEN 41 AND 50 THEN '41-50'
                        ELSE '>50'
                    END`.as('range_umur'),
                kyselyDb.fn.count('usia').as('count'),
            ])
            .groupBy('range_umur')
            .execute();

        const employeesByUnit = await kyselyDb
            .selectFrom('karyawan')
            .select([
                'unit',
                sql`SPLIT_PART(bergabung_sejak, '-', 1)`.as('bulan'),
                sql`COUNT(*)`.as('jumlah')
            ])
            .where('status_karyawan', '=', 'Aktif')
            .groupBy(['unit', sql`SPLIT_PART(bergabung_sejak, '-', 1)`])
            .execute();

        const unitOrder = [
            'Kantor Telkom Regional III',
            'Witel Suramadu',
            'Witel Jatim Timur',
            'Witel Jatim Barat',
            'Witel Bali',
            'Witel Nusa Tenggara',
            'Witel Semarang Jateng Utara',
            'Witel Yogya Jateng Selatan',
            'Witel Solo Jateng Timur'
        ];

        const monthNames = [
            'Januari',
            'Februari',
            'Maret',
            'April',
            'Mei',
            'Juni',
            'Juli',
            'Agustus',
            'September',
            'Oktober',
            'November',
            'Desember'
        ];

        const unitMonthlyData = {};

        unitOrder.forEach(unit => {
            unitMonthlyData[unit] = monthNames.reduce((acc, month) => {
                acc[month] = 0;
                return acc;
            }, {});
        });

        employeesByUnit.forEach(record => {
            if (unitOrder.includes(record.unit)) {
                const monthIndex = parseInt(record.bulan) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    unitMonthlyData[record.unit][monthNames[monthIndex]] = Number(record.jumlah);
                }
            }
        });

        const formattedUnitData = unitOrder.map(unit => ({
            nama_unit: unit,
            data_bulanan: monthNames.map(bulan => ({
                bulan,
                jumlah: unitMonthlyData[unit][bulan]
            }))
        }));

        const expectedAgeRanges = ['21-30', '31-40', '41-50', '>50'];
        const ageRangeCounts = expectedAgeRanges.reduce((acc, range) => {
            acc[range] = 0;
            return acc;
        }, {});

        employeeAgeCounts.forEach(item => {
            const range = item.range_umur;
            if (ageRangeCounts.hasOwnProperty(range)) {
                ageRangeCounts[range] = Number(item.count || 0);
            }
        });

        const simplifiedResult = {
            karyawan_aktif: Number(totalActiveEmployees?.karyawan_aktif || 0),
            total_karyawan: Number(totalEmployees?.total_karyawan || 0),
            jumlah_karyawan: {
                berdasarkan_jenis_kelamin: employeeGenderCounts.map(item => ({
                    jenis_kelamin: item.jenis_kelamin,
                    jumlah: Number(item.count || 0),
                })),
                berdasarkan_usia: expectedAgeRanges.map(range => ({
                    range_umur: {
                        range_umur: range,
                        jumlah: ageRangeCounts[range].toString(),
                    }
                })),
                berdasarkan_unit: formattedUnitData
            },
        };

        return simplifiedResult;
    } catch (error) {
        console.error('Error fetching dashboard summary:', error.message);
        throw new Error('Failed to fetch dashboard summary');
    }
};