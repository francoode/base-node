const disk = require('diskusage');
const os = require('os');
const nodemailer = require('nodemailer');
const publicIp = require('public-ip');
const axios = require('axios');
const { exec } = require('child_process');

const MB_LIMIT = process.env.MB_LIMIT;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASS = process.env.USER_PASS;
const FROM_EMAIl = process.env.FROM_EMAIl;
const to = process.env.TO_EMAIl.split(' ');

let enableSendEmailMinSpace = true;

const mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: USER_EMAIL,
        pass: USER_PASS
    }
});


const mailOptions = {
    from: FROM_EMAIl,
    to: '',
    subject: 'Alerta. Espacio de disco mínimo.',
    text: ''
};

setInterval(async () => {
    await getFreeSpace('/', false);

    if (process.env.VOLUME_PATH) {
        await getFreeSpace(process.env.VOLUME_PATH, true);
    }
}, 5000)

async function getFreeSpace(path, resize) {
    try {
        const {free, available, total} = await disk.check(path);

        const freeMb = Math.floor(Number(free * (9.537 * Math.pow(10, -7))));
        console.log(`Free space: ${freeMb}`);

        const availableMb = Math.floor(Number(available * (9.537 * Math.pow(10, -7))));
        console.log(`available: ${availableMb}`);

        // warning email
        if (availableMb <= Number(MB_LIMIT) && enableSendEmailMinSpace) {
            const ip = await publicIp.v4();
            mailOptions.text = `Server ip: ${ip} - Espacio libre: ${freeMb} MB - Espacio disponible: ${availableMb} MB`
            for (let index = 0; index < to.length; index++) {
                mailOptions.to = to[index];
                const info = await mail.sendMail(mailOptions);
                console.log('Email sent: ' + info.response);
                enableSendEmailMinSpace = false;
                setTimeout(() => {
                    enableSendEmailMinSpace = true
                }, 1000 * 60 * 60 * 24);
                mailOptions.to = '';
            }
        }

        // new size
        if (availableMb <= Number(MB_LIMIT) && resize) {
            const totalGb = Math.floor(Number(total * (9.537 * Math.pow(10, -10))));
            const amountToAdd = (process.env.AMOUNT_GB_ADD) ? process.env.AMOUNT_GB_ADD : 5;
            const newSize = totalGb + amountToAdd;

            if (process.env.VOLUME_ID) {
                const respNewAmount = await axios.post(`https://api.digitalocean.com/v2/volumes/${process.env.VOLUME_ID}/actions`,
                    {
                        type: "resize",
                        size_gigabytes: newSize,
                        region: process.env.VOLUME_REGION
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN_DO}`
                        },
                    });

                if(respNewAmount.data) {
                    exec('ls | grep js', (err, stdout, stderr) => {
                        if (err) {
                            //some err occurred
                            console.error(err)
                        } else {
                            // the *entire* stdout and stderr (buffered)
                            console.log(`stdout: ${stdout}`);
                            console.log(`stderr: ${stderr}`);
                        }
                    });
                }
            }


            const ip = await publicIp.v4();
            mailOptions.text = ``
            for (let index = 0; index < to.length; index++) {
                mailOptions.to = to[index];
                const info = await mail.sendMail(mailOptions);
                console.log('Email sent: ' + info.response);
                enableSendEmailMinSpace = false;
                setTimeout(() => {
                    enableSendEmailMinSpace = true
                }, 1000 * 60 * 60 * 24);
                mailOptions.to = '';
            }
        }

        if (availableMb > Number(MB_LIMIT)) {
            enableSendEmailMinSpace = true;
        }

    } catch (err) {
        console.error(err)
        return 0
    }
}
