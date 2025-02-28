import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegionsService } from '../regions/regions.service';
import { CalendarService } from '../calendar/calendar.service';
import * as moment from 'moment-timezone';
import { schedule } from 'node-cron';

@Injectable()
export class BotService implements OnModuleInit {
  bot: Telegraf;
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly regionsService: RegionsService,
    private readonly calendarService: CalendarService,
  ) {
    this.bot = new Telegraf(
      this.configService.get<string>('BOT_TOKEN') as string,
    );
  }

  async onModuleInit() {
    try {
      await this.setupBot();
      await this.allHears();
      await this.notification();
      await this.updateRegion();
      this.proposal();
      this.commands();
      this.sendPhoto();
      schedule('*/10 * * * * *', async () => {
        await this.sendNotification();
      });
      await this.todayTimes();
      await this.bot.telegram.deleteWebhook();
      process.nextTick(async () => {
        await this.bot.launch({ dropPendingUpdates: true });
      });
    } catch (error) {
      console.log(error.message);
    }
  }
  async setupBot() {
    this.bot.start(async (ctx) => {
      const user = ctx.chat;

      if (!user) return;

      try {
        const foundUser = await this.usersService.getUserByTgId(user.id);

        if (foundUser) {
          ctx.reply(
            `Assalomu alaykum, ${foundUser.first_name || foundUser.title}!`,
          );
          this.mainMenu(ctx);
          return;
        }
        const createdUser = await this.usersService.createUser(user);

        ctx.reply(
          `Assalomu alaykum, ${createdUser?.first_name || createdUser?.title}!`,
        );
        ctx.reply(
          '📍 Hududingizni tanlang:',
          Markup.keyboard([
            ['Angren', 'Andijon'],
            ['Xonobod', 'Shahrixon'],
            ["Xo'jaobod", 'Namangan'],
            ['Pop', 'Chortoq'],
            ['Chust', "Farg'ona"],
            ['Rishton', "Qo'qon"],
            ['Quva', 'Bekobod'],
            ['Buxoro', "G'azli"],
            ["G'ijduvon", "Korako'l"],
            ['Guliston', 'Sardoba'],
            ['Jizzax', 'Zomin'],
            ['Forish', "G'allaorol"],
            ['Navoiy', 'Zarafshon'],
            ['Mingbuloq', 'Konimex'],
            ['Nurota', 'Uchquduq'],
            ['Nukus', "Mo'ynoq"],
            ["Taxtako'pir", "To'rtko'l"],
            ["Qo'ng'irot", 'Samarqand'],
            ['Ishtixon', 'Mirbozor'],
            ["Kattaqo'rg'on", 'Urgut'],
            ['Termiz', 'Boysun'],
            ['Denov', 'Sherobod'],
            ["Sho'rchi", 'Qarshi'],
            ['Dehqonobod', 'Koson'],
            ['Muborak', 'Shahrisabz'],
            ["G'uzor", 'Urganch'],
            ['Toshkent shahri']['Orqaga'],
          ]).resize(),
        );
      } catch (error) {
        ctx.reply(
          "Xatolik yuz berdi. Qaytadan urinib ko'ring yoki @jamshidbekmansurov ga murojaat qiling.",
        );
      }
    });
    this.bot.hears('🏠 Asosiy menyu', (ctx) => {
      this.mainMenu(ctx);
    });
  }
  async allHears() {
    const regions = await this.regionsService.getAllRegions();
    regions.forEach((region) => {
      this.bot.hears(region.region, async (ctx) => {
        const userRegion = region.region;
        await this.usersService.updateRegion(ctx.chat, userRegion);
        ctx.reply(`📍 Sizning hududingiz: ${userRegion}`);
        this.mainMenu(ctx);
      });
    });
  }
  async mainMenu(ctx: any) {
    ctx.reply(
      '🏠 Asosiy menyu:',
      Markup.keyboard([
        ["📍 Hududni o'zgartirish", '📆 Taqvim rasmini olish'],
        ['🔔 Yoqish', "🔕 O'chirish"],
        ['📆 Bugungi taqvim'],
        ['✉️ Taklif va murojaatlar uchun'],
      ]).resize(),
    );
  }
  async notification() {
    this.bot.hears('🔔 Yoqish', async (ctx) => {
      try {
        const data = await this.usersService.turnOnSchedule(ctx.chat);
        if (data) {
          ctx.reply(
            "🔔 Bildirishnoma muvaffaqqiyatli yoqildi. Endi sizga har kunlik saharlik va iftorlik vaqtlari eslatib boriladi. Eslatib o'tamiz taqvim vaqtlari siz tanlagan hudud asosida yuboriladi.",
          );
        }
      } catch (error) {
        if (error.message === 'user-not-found') {
          ctx.reply('Avval /start bosing!');
        } else if (error.message === 'region-not-found') {
          ctx.reply(
            "Iltimos avval hudud tanlang. So'ng siz tanlagan hudud bo'yicha taqvim avtomatik yuboriladi",
            Markup.keyboard(['📍 Hudud tanlash']).resize(),
          );
        } else {
          ctx.reply('Xatolik yuz berdi.');
        }
      }
    });
    this.bot.hears("🔕 O'chirish", async (ctx) => {
      try {
        const data = await this.usersService.turnOffSchedule(ctx.chat);
        if (data) {
          ctx.reply("🔔 Bildirishnoma muvaffaqqiyatli o'chirildi.");
        }
      } catch (error) {
        if (error.message === 'user-not-found') {
          ctx.reply('Avval /start bosing!');
        } else {
          ctx.reply('Xatolik yuz berdi.');
        }
      }
    });
  }
  async updateRegion() {
    this.bot.hears('📍 Hudud tanlash', (ctx) => {
      ctx.reply(
        "📍 Hududingizni tanlang (❗️ Eslatib o'tamiz hudud tanlashda hushyor bo'ling chunki har kunlik taqvim vaqtlari siz tanlagan hudud asosida yuboriladi.):",
        Markup.keyboard([
          ['Angren', 'Andijon'],
          ['Xonobod', 'Shahrixon'],
          ["Xo'jaobod", 'Namangan'],
          ['Pop', 'Chortoq'],
          ['Chust', "Farg'ona"],
          ['Rishton', "Qo'qon"],
          ['Quva', 'Bekobod'],
          ['Buxoro', "G'azli"],
          ["G'ijduvon", "Korako'l"],
          ['Guliston', 'Sardoba'],
          ['Jizzax', 'Zomin'],
          ['Forish', "G'allaorol"],
          ['Navoiy', 'Zarafshon'],
          ['Mingbuloq', 'Konimex'],
          ['Nurota', 'Uchquduq'],
          ['Nukus', "Mo'ynoq"],
          ["Taxtako'pir", "To'rtko'l"],
          ["Qo'ng'irot", 'Samarqand'],
          ['Ishtixon', 'Mirbozor'],
          ["Kattaqo'rg'on", 'Urgut'],
          ['Termiz', 'Boysun'],
          ['Denov', 'Sherobod'],
          ["Sho'rchi", 'Qarshi'],
          ['Dehqonobod', 'Koson'],
          ['Muborak', 'Shahrisabz'],
          ["G'uzor", 'Urganch'],
          ['Toshkent shahri'],
          ['🏠 Asosiy menyu'],
        ]).resize(),
      );
    });
    this.bot.hears("📍 Hududni o'zgartirish", async (ctx) => {
      ctx.reply(
        "📍 Hududingizni tanlang (❗️ Eslatib o'tamiz hudud tanlashda hushyor bo'ling chunki har kunlik taqvim vaqtlari siz tanlagan hudud asosida yuboriladi.):",
        Markup.keyboard([
          ['Angren', 'Andijon'],
          ['Xonobod', 'Shahrixon'],
          ["Xo'jaobod", 'Namangan'],
          ['Pop', 'Chortoq'],
          ['Chust', "Farg'ona"],
          ['Rishton', "Qo'qon"],
          ['Quva', 'Bekobod'],
          ['Buxoro', "G'azli"],
          ["G'ijduvon", "Korako'l"],
          ['Guliston', 'Sardoba'],
          ['Jizzax', 'Zomin'],
          ['Forish', "G'allaorol"],
          ['Navoiy', 'Zarafshon'],
          ['Mingbuloq', 'Konimex'],
          ['Nurota', 'Uchquduq'],
          ['Nukus', "Mo'ynoq"],
          ["Taxtako'pir", "To'rtko'l"],
          ["Qo'ng'irot", 'Samarqand'],
          ['Ishtixon', 'Mirbozor'],
          ["Kattaqo'rg'on", 'Urgut'],
          ['Termiz', 'Boysun'],
          ['Denov', 'Sherobod'],
          ["Sho'rchi", 'Qarshi'],
          ['Dehqonobod', 'Koson'],
          ['Muborak', 'Shahrisabz'],
          ["G'uzor", 'Urganch'],
          ['Toshkent shahri'],
          ['🏠 Asosiy menyu'],
        ]).resize(),
      );
    });
  }
  async commands() {
    this.bot.command('menu', (ctx) => {
      this.mainMenu(ctx);
    });
  }
  async proposal() {
    this.bot.hears('✉️ Taklif va murojaatlar uchun', (ctx) => {
      ctx.reply(
        '✉️ Taklif va murojaatlar uchun @jamshidbekmansurov ga murojaat qiling!',
      );
    });
  }
  async sendPhoto() {
    this.bot.hears('📆 Taqvim rasmini olish', (ctx) => {
      const user = ctx.chat;
      ctx.sendPhoto(
        'https://st.muslim.uz/cache/b/4/3/e/2/b43e2294f9bb3a476fae98003659a58a442b36c7.jpeg',
        {
          caption: '🗓 *Bu taqvim Toshkent vaqti bo‘yicha tuzilgan.* ⏳',
        },
      );
    });
  }
  sendMessage(id: any, msg: any) {
    try {
      this.bot.telegram.sendMessage(id, msg);
    } catch (error) {
      console.log(error.message);
    }
  }
  async sendNotification() {
    const duas = {
      suhoor: `
Nawaytu an asuuma Sowma shahri ramadoon(a)
Minal fajri ilal mag‘rib(i) Xoolisan lillahi 
ta’aala Allohu Akbar.`,
      iftar: `
Allohumma laka sumtu Va bika aamantu
Va ‘alayka tavakkaltu Va alaa rizqika aftortu
Fag‘fir-lii yag‘o’ffaar(u) Maa qoddmtu
Va maa axxortu. Birohmatika yaa arhamar roohimiyn.`,
    };

    const users = await this.usersService.getAllActiveUsers();
    if (!users) return;

    const now = moment().tz('Asia/Tashkent').format('HH:mm');

    users.forEach(async (user) => {
      const todayTimes = await this.calendarService.getCalendarByRegion(
        user.region,
      );
      if (!todayTimes) return;

      if (now === '01:00') {
        this.sendMessage(
          user.id,
          `🌙 *Ramazonning ${todayTimes.day}-kuni* uchun ro‘za jadvali (${user.region} hududi bo‘yicha):  

🔹 *Saharlik vaqti* (og‘iz yopish): *${todayTimes.suhoor}*  
🔹 *Iftorlik vaqti* (og‘iz ochish): *${todayTimes.iftar}*  

📅 *Bugungi sana:* ${todayTimes.date}  
🕌 Ro‘zangiz qabul bo‘lsin! 🤲`,
        );
      }

      const { suhoor, iftar } = todayTimes;
      const suhoorReminder = moment(suhoor, 'HH:mm')
        .subtract(10, 'minutes')
        .format('HH:mm');
      const iftarReminder = moment(iftar, 'HH:mm')
        .subtract(10, 'minutes')
        .format('HH:mm');
      const suhoorTime = moment(suhoor, 'HH:mm')
        .subtract(1, 'minutes')
        .format('HH:mm');
      const iftarTime = moment(iftar, 'HH:mm').format('HH:mm');

      if (suhoorReminder === now) {
        this.sendMessage(
          user.id,
          `⏳ *Eslatma:* (${user.region} hududi bo‘yicha) Saharlik vaqti tugashiga *10 daqiqa* qoldi.  
Shoshiling, duolaringizni qabul qiling va niyat qiling! 🤲`,
        );
      } else if (suhoorTime === now) {
        this.sendMessage(
          user.id,
          `🌅 *Saharlik vaqti tugadi!* (${user.region} hududi bo‘yicha)  
Alloh ro‘zangizni qabul qilsin! 🤲  

📜 *Saharlik duosi:*  
${duas.suhoor}`,
        );
      }

      if (iftarReminder === now) {
        this.sendMessage(
          user.id,
          `⏳ *Eslatma:* (${user.region} hududi bo‘yicha) Iftorlik vaqtiga *10 daqiqa* qoldi.  
Alloh ro‘zangizni qabul qilsin! 🌙🤲`,
        );
      } else if (iftarTime === now) {
        this.sendMessage(
          user.id,
          `🌇 *Iftorlik vaqti boshlandi!* (${user.region} hududi bo‘yicha)  
Ro‘zangiz muborak bo‘lsin!  

📜 *Iftorlik duosi:*  
${duas.iftar}`,
        );
      }
    });
  }
  async todayTimes() {
    this.bot.hears('📆 Bugungi taqvim', async (ctx) => {
      const findUser = await this.usersService.getUserByTgId(ctx.chat.id);
      if (!findUser) {
        ctx.reply('Avval botga /start bering!');
      }

      if (!findUser?.region) {
        ctx.reply(
          "Avval hudud tanlang so'ngra sizga bugunlik taqvim jo'natiladi.",
        );
        Markup.keyboard(['📍 Hudud tanlash']).resize();
      }

      const times = await this.calendarService.getCalendarByRegion(
        findUser?.region as string,
      );
      if (!times) {
        ctx.reply(
          'Bugungi kun taqvimi topilmadi. Ehtimol bugun ramazon kunlaridan biri emas.',
        );
        return;
      }

      ctx.reply(`🌙 *Ramazonning ${times?.day}-kuni* uchun ro‘za jadvali (${findUser?.region} hududi bo‘yicha):  

🔹 *Saharlik vaqti* (og‘iz yopish): *${times?.suhoor}*  
🔹 *Iftorlik vaqti* (og‘iz ochish): *${times?.iftar}*  

📅 *Bugungi sana:* ${times?.date}  
🕌 Ro‘zangiz qabul bo‘lsin! 🤲`);
    });
  }
}
