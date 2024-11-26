import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from './middleware/cors';
import { loginUser, changePassword, getAllUsers, getUserById, requestPasswordReset, resetPassword } from './src/services/userService';
import { getDashboardSummary } from './src/services/dashboardService'; 
import { getAllKaryawan, getKaryawanById, filterKaryawanByUnits, getKaryawanDetails } from './src/services/employeeService';
import { getAllMutasi, findKaryawanByPerner, createMutasi, isDuplicateMutasi, getMutasiDetails, updateMutasiStatus, deleteMutasi } from './src/services/mutasiService';
import { validateLogin } from './src/validators/loginValidator';
import { validateUnitAndSubUnit } from './src/validators/unitValidator';
import authenticate from './middleware/authenticate';
import { users } from './src/db/dbSchema';
import { checkRole } from './middleware/checkRole';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const data = require('./src/utils/units.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

app.use(cors(corsOptions));

app.listen(port, () => {
  console.log(`Yeay! Server is successfully running on port: ${port}`);
});

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.get('/dropdown', (req, res) => {
    res.json(data);
  });

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    validateLogin({ username, password });

    const user = await loginUser(username, password);

    const token = jwt.sign(
        { id: user.id, username: user.username, name: user.name, id_roles: user.id_roles },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );

    res.status(200).json({ message: 'Login successful', user: { id: user.id, name: user.name, username: user.username, id_roles: user.id_roles }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/validate-token', authenticate, async (req, res) => {
    try {
        const user = req.user; 

        // Konversi iat dan exp ke waktu manusia dalam GMT+7
        const convertToGMT7 = (timestamp) => {
            const date = new Date(timestamp * 1000); // Konversi UNIX timestamp ke JS Date
            return new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Jakarta', // GMT+7
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }).format(date);
        };

        const tokenCreatedIn = convertToGMT7(user.iat);
        const tokenExpiredIn = convertToGMT7(user.exp);

        res.json({
            message: 'Token is valid',
            user: {
                id: user.id,
                name: user.name, 
                username: user.username, 
                token_created_in: tokenCreatedIn,
                token_expired_in: tokenExpiredIn,
            },
        });
    } catch (error) {
        console.error('Error validating token:', error);
        res.status(500).json({ error: 'Error validating token' });
    }
});

app.post('/change-password', authenticate, async (req, res) => {
    try {
        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
        return res.status(400).json({ error: 'Old password and new password are required' });
        }

        const userId = req.user.id; // Ifrom token

        const response = await changePassword(userId, old_password, new_password);

        res.status(200).json(response);  
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
  
app.get('/users', async (req, res) => {
    try {
        const users = await getAllUsers();
        console.log(`Successfully retrieved ${users.length} user(s).`);
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});
  
// profile page
app.get('/users/:id', authenticate, checkRole([1, 2, 3, 4]), async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ error: 'Error fetching user data' });
    }
});


app.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body; 
        await requestPasswordReset(username);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}); 

app.get('/reset/:token', async (req, res) => {
    const { token } = req.params;
    const { username } = req.query;

    if (!username) {
        return res.status(400).send('Username is required');
    }

    // reset password form 
    res.send(`
        <form action="/reset/${token}" method="POST">
            <input type="hidden" name="token" value="${token}" />
            <input type="hidden" name="username" value="${username}" /> 
            <label for="newPassword">New Password:</label>
            <input type="password" name="newPassword" required />
            <button type="submit">Reset Password</button>
        </form>
    `);
  });
  
app.post('/reset/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword, username } = req.body; 

    console.log('Received token:', token);
    console.log('Received new password:', newPassword);
    console.log('Received username:', username);
    
    try {
        // Check if token and new password are provided
        if (!token || !newPassword || !username) {
            return res.status(400).json({ error: 'Token, username, and new password are required' });
        }

        // Call resetPassword service function
        await resetPassword(token, newPassword, username);
        res.status(200).send('Congratulations! Your password has been successfully reset.');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// dashboard summary
app.get('/dashboard', authenticate, checkRole([1, 2, 3, 4]), async (req, res) => {
    try {
        const dashboardSummary = await getDashboardSummary();
        console.log('Successfully retrieved dashboard summary.');
        res.json({ dashboardSummary });
    } catch (error) {
        console.error('Error retrieving dashboard summary:', error);
        res.status(500).json({ error: 'Error retrieving dashboard summary' });
    }
});

// all karyawan
app.get('/karyawan', authenticate, checkRole([1, 2, 3, 4]), async (req, res) => {  
    try {  
        const results = await getAllKaryawan(req, res);  
        res.json(results);  
    } catch (error) {  
        console.error('Error fetching karyawan:', error);  
        return res.status(500).json({ error: 'Internal server error' });  
    }  
});

app.get('/karyawan/filter', authenticate, checkRole([1, 2, 3, 4]), async (req, res) => {
    try {
        const { unit } = req.query;

        if (!unit) {
            return res.status(400).json({ error: 'Parameter "unit" wajib disertakan' });
        }

        const { karyawanList, totalPerUnit } = await filterKaryawanByUnits(unit);

        res.status(200).json({
            message: 'Data karyawan berhasil diambil',
            total: karyawanList.length,
            totalPerUnit, 
            data: karyawanList
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

  
// detail karyawan
app.get('/karyawan/:id', authenticate, checkRole([1, 2, 3, 4]), async (req, res) => {  
    try {  
        const karyawanId = req.params.id;  
        const karyawan = await getKaryawanById(karyawanId);  

        if (!karyawan) {
            return res.status(404).json({ error: 'Karyawan not found' });
        }

        res.json(karyawan);  
    } catch (error) {  
        console.error('Error fetching karyawan by ID:', error);  
        return res.status(500).json({ error: error.message });  
    }  
});  

// find karyawan by name (BEFORE CREATE MUTASI)
app.get('/mutasi/karyawan/:nama', authenticate, checkRole([2]), async (req, res) => {  
    try {  
        const { nama } = req.params;  
        const karyawanDetails = await getKaryawanDetails(nama);  
        
        if (!karyawanDetails || karyawanDetails.length === 0) {
            return res.status(404).json({ error: 'Karyawan not found' });
        }

        res.json(karyawanDetails);  
    } catch (error) {  
        console.error('Error fetching karyawan details:', error);  
        return res.status(500).json({ error: error.message });  
    }  
});  

// create mutasi
app.post('/mutasi', authenticate, checkRole([2]), async (req, res) => {
    try {
        const { perner, unit_baru, sub_unit_baru, posisi_baru } = req.body;
        
        const isValid = validateUnitAndSubUnit(unit_baru, sub_unit_baru);
        if (!isValid) {
            return res.status(400).json({ message: 'Unit atau Sub-Unit tidak valid' });
        }

        const isDuplicate = await isDuplicateMutasi(perner, unit_baru, sub_unit_baru);
        if (isDuplicate) {
            return res.status(409).json({ message: 'Mutasi dengan unit dan sub-unit yang sama sudah ada' });
        }

        const karyawan = await findKaryawanByPerner(perner);
        if (!karyawan) {
            return res.status(404).json({ message: 'Karyawan tidak ditemukan' });
        }
        
        await createMutasi({ perner, unit_baru, sub_unit_baru, posisi_baru });

        res.status(201).json({ message: 'Pengajuan mutasi berhasil diajukan.' });
    } catch (error) {
        console.error('Error processing mutasi:', error);
        res.status(500).json({ error: 'Failed to process mutasi' });
    }
});


// mutasi details
app.get('/mutasi/:perner', authenticate, checkRole([1, 2, 3, 4]), async (req, res) => {
    try {
        const { perner } = req.params;
        const mutasiDetails = await getMutasiDetails(perner);
        
        res.json(mutasiDetails);
    } catch (error) {
        console.error('Error fetching mutasi details:', error);
        return res.status(500).json({ error: error.message });
    }
});

// approve mutasi
app.post('/mutasi/:perner/persetujuan', authenticate, checkRole([2]), async (req, res) => {
    try {
        const { perner } = req.params;

        // Update status mutasi menjadi "Disetujui"
        const result = await updateMutasiStatus(perner, 'Disetujui', null); // Alasan di-set null untuk persetujuan
        
        res.json({ message: 'Mutasi disetujui', status: result });
    } catch (error) {
        console.error('Error updating mutasi status to approved:', error);
        res.status(500).json({ error: 'Error updating mutasi status' });
    }
});

// rejected mutasi
app.post('/mutasi/:perner/penolakan', authenticate, checkRole([2]), async (req, res) => {
    try {
        const { perner } = req.params;
        const { alasan_penolakan } = req.body;  // Ambil alasan_penolakan dari request body

        if (!alasan_penolakan) {
            return res.status(400).json({ message: 'Alasan penolakan diperlukan' });
        }

        // Update status mutasi menjadi "Ditolak" dengan alasan_penolakan
        const result = await updateMutasiStatus(perner, 'Ditolak', alasan_penolakan);

        res.json({ message: 'Mutasi ditolak', status: result });
    } catch (error) {
        console.error('Error updating mutasi status to rejected:', error);
        res.status(500).json({ error: 'Error updating mutasi status' });
    }
});

// get all mutasi
app.get('/mutasi', authenticate, checkRole([1, 2, 3, 4]), async (req, res) => {
    try {
        const mutasi = await getAllMutasi();
        res.json(mutasi); 
    } catch (error) {
        console.error('Error fetching mutasi:', error);
        res.status(500).json({ error: 'Failed to fetch mutasi' });
    }
});

// delete mutasi
app.delete('/mutasi/:perner', authenticate, checkRole([2]), async (req, res) => {
    try {
        const { perner } = req.params;  

        const response = await deleteMutasi(perner);

        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
