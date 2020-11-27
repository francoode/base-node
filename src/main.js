const disk = require('diskusage');
const os = require('os');
const nodemailer = require('nodemailer');
const publicIp = require('public-ip');

const MB_LIMIT = process.env.MB_LIMIT;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASS = process.env.USER_PASS;
const FROM_EMAIl = process.env.FROM_EMAIl;
const to = process.env.TO_EMAIl.split(' ');

let enableSendEmail = true;

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
    await getFreeSpace(mail);
}, 5000)

async function getFreeSpace(mail) {
    try {
        const path = (os.platform() === 'win32') ? 'c:' : (process.env.VOLUME_PATH) ? process.env.VOLUME_PATH : '/';
        const {free, available} = await disk.check(path);

        const freeMb = Number(free * (9.537 * Math.pow(10, -7)));
        console.log(`Free space: ${freeMb}`);

        const availableMb = Number(available * (9.537 * Math.pow(10, -7)));
        console.log(`available: ${availableMb}`);

        if (availableMb <= Number(MB_LIMIT) && enableSendEmail) {
            const ip = await publicIp.v4();
            mailOptions.text = `Server ip: ${ip} - Espacio libre: ${freeMb} MB - Espacio disponible: ${availableMb} MB`
            for (let index = 0; index < to.length; index++) {
                mailOptions.to = to[index];
                mail.sendMail(mailOptions)
                    .then((info) => {
                        console.log('Email sent: ' + info.response);
                        enableSendEmail = false;
                        setTimeout(() => {
                            enableSendEmail = true;
                        }, 1000 * 60 * 60 * 24);
                    })
                    .catch((e) => console.log(e))

                mailOptions.to = '';
            }
        }

        if(availableMb > Number(MB_LIMIT)) {
            enableSendEmail = true;
        }

    } catch (err) {
        console.error(err)
        return 0
    }
}
