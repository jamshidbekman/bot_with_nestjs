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
      schedule('*/35 * * * * *', async () => {
        await this.sendNotification();
      });
      await this.todayTimes();
      await this.tomorrowTimes();
      await this.adminCommands();
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
      const user = await ctx.chat;

      if (!user) return;

      try {
        const foundUser = await this.usersService.getUserByTgId(user.id);

        if (foundUser) {
          await ctx.reply(
            `Assalomu alaykum, ${foundUser.first_name || foundUser.title}!`,
          );
          await this.mainMenu(ctx);
          return;
        }
        const createdUser = await this.usersService.createUser(user);

        await ctx.reply(
          `Assalomu alaykum, ${createdUser?.first_name || createdUser?.title}!`,
        );
        await ctx.reply(
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
            ['Toshkent shahri'],
            ['🏠 Asosiy menyu'],
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
        ['📆 Bugungi taqvim', '📆 Ertagalik taqvim'],
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
  async sendMessage(id: any, msg: any) {
    try {
      await this.bot.telegram.sendMessage(id, msg);
    } catch (error) {
      console.log(`${id} botni bloklagan - ${error.message}`);
    }
  }
  async sendNotification() {
    const duas = {
      suhoor: `
Navaytu an asuma sovma shahri ramazona minal 
fajri ilal mag‘ribi, xolisan lillahi ta‘ala. 
Allohu akbar.`,
      iftar: `
Allohumma laka sumtu va bika amantu va ‘alayka 
tavakkaltu va ‘ala rizqika aftortu, fag‘firli ya 
G‘offaru ma qoddamtu va ma axxortu.`,
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

📅 *Bugungi sana:* ${todayTimes.date}`,
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
Shoshiling!`,
        );
      } else if (suhoorTime === now) {
        this.sendMessage(
          user.id,
          `🌅 *Saharlik vaqti tugadi!* (${user.region} hududi bo‘yicha)  

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
  async tomorrowTimes() {
    this.bot.hears('📆 Ertagalik taqvim', async (ctx) => {
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
      const times = await this.calendarService.getTomorrowCalendarByRegion(
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

📅 *Sana:* ${times?.date}  
🕌 Ro‘zangiz qabul bo‘lsin! 🤲`);
    });
  }
  async sendMessageAllMembers(message: string) {
    const users = await this.usersService.getAllUsers();
    if (!users) return;
    users.forEach(async (user) => {
      try {
        await this.sendMessage(user.id, message);
      } catch (error) {
        console.log(error.message);
      }
    });
  }
  async adminCommands() {
    this.bot.command('sendmessage', async (ctx) => {
      if (ctx.chat.id !== Number(this.configService.get<number>('ADMIN_ID')))
        return;

      const message = ctx.message.text.replace('/sendmessage', '').trim();

      if (!message) {
        return ctx.reply('Xabar matnini kiriting: /sendall XABAR');
      }
      await this.sendMessageAllMembers(message);
      ctx.reply('Xabar barcha foydalanuvchilarga jo‘natildi!');
    });
    this.bot.command('users', async (ctx) => {
      if (ctx.chat.id !== Number(this.configService.get<number>('ADMIN_ID')))
        return;
      const activeUsers = await this.usersService.getAllActiveUsers();
      const allUsers = await this.usersService.getAllUsers();
      if (!activeUsers && !allUsers) return;
      await ctx.reply(
        `Bildirishnoma olayotgan foydalanuvchilar: ${activeUsers.length}`,
      );
      await ctx.reply(`Barcha foydalanuvchilar: ${allUsers.length}`);
    });
  }
}
