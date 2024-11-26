import { pgTable, serial, text, varchar, numeric, uuid, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: text('name'),
  username: text('username').unique(),
  password: text('password'),
  roles: text('roles'),
});

export const karyawan = pgTable('karyawan', {  
  perner: serial('perner').primaryKey(),  
  nama: varchar('nama'),  
  take_home_pay: numeric('take_home_pay'),  
  unit: varchar('unit'),  
  sub_unit: varchar('sub_unit'),  
  posisi_pekerjaan: varchar('posisi_pekerjaan'),  
  sumber_anggaran: varchar('sumber_anggaran'),  
}); 

export const mutasi = pgTable('mutasi', {
  id: serial('id').primaryKey(),
  perner: varchar('perner').references(() => karyawan.perner), // Foreign key ke tabel karyawan
  unit_baru: varchar('unit_baru'),
  sub_unit_baru: varchar('sub_unit_baru'),
  kota_baru: varchar('kota_baru'),
  posisi_baru: varchar('posisi_baru'),
  status_mutasi: text('status_mutasi').default('Diproses'), // Status default: Diproses
  created_at: timestamp('created_at').defaultNow(),
});