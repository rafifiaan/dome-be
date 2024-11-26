const { Kysely, PostgresDialect } = require('kysely');
const { Table } = require('kysely');

const users = {
  id: 'uuid',
  name: 'text',
  username: 'text',
  password: 'text',
  roles: 'text',
  reset_token: 'text',            
  reset_token_expires: 'timestamp' 
};

const mutasi = {
  id: 'serial',                 // Auto increment primary key
  perner: 'varchar',            // Foreign key ke tabel karyawan
  unit_baru: 'varchar',
  sub_unit_baru: 'varchar',
  kota_baru: 'varchar',
  posisi_baru: 'varchar',
  status_mutasi: 'text',        // Status mutasi, default 'Diproses'
  created_at: 'timestamp',      // Tanggal pengajuan
};

module.exports = { users, mutasi };
