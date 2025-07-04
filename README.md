# تطبيق إدارة المهام

تطبيق ويب لإدارة المهام اليومية مع إمكانية حفظ المهام المكتملة في قاعدة بيانات وعرضها لاحقاً.

## المميزات

- ✨ إضافة مهام جديدة مع ملاحظات وتواريخ
- 📅 تنظيم المهام حسب التاريخ
- ✅ تحديد المهام كمكتملة
- 💾 حفظ المهام المكتملة في قاعدة بيانات
- 🗄️ عرض المهام المحفوظة مع إمكانية التصفية حسب التاريخ
- 🗑️ حذف المهام من قاعدة البيانات
- 🔔 نظام إشعارات متكامل
- 📱 تصميم متجاوب مع جميع الأجهزة

## المتطلبات

- Node.js (الإصدار 14 أو أحدث)
- npm (مدير حزم Node.js)

## خطوات التثبيت

1. قم بنسخ المستودع:
```bash
git clone <رابط-المستودع>
cd <اسم-المجلد>
```

2. قم بتثبيت الاعتمادات:
```bash
npm install
```

3. قم بتشغيل الخادم:
```bash
npm start
```

4. افتح المتصفح وانتقل إلى:
```
http://localhost:3000
```

## ملاحظات مهمة

- تأكد من عدم استخدام المنفذ 3000 من قبل تطبيق آخر
- في حال وجود خطأ عند تشغيل الخادم، قم بإيقاف أي عملية تستخدم المنفذ 3000:
  ```bash
  # في Windows
  netstat -ano | findstr :3000
  taskkill /PID <رقم-العملية> /F

  # في Linux/Mac
  lsof -i :3000
  kill -9 <رقم-العملية>
  ```

## هيكل المشروع

```
/
├── server.js          # ملف الخادم الرئيسي
├── db.js             # إعدادات قاعدة البيانات
├── index.html        # صفحة الويب الرئيسية
├── style.css         # أنماط CSS
├── script.js         # كود JavaScript للواجهة الأمامية
├── package.json      # تبعيات المشروع
└── tasks.db          # ملف قاعدة البيانات SQLite
```

## التقنيات المستخدمة

- 🌐 Express.js للخادم
- 💾 SQLite3 لقاعدة البيانات
- 📅 Moment.js لمعالجة التواريخ
- 🎨 CSS3 للتصميم
- 📱 تصميم متجاوب
- 🌐 Fetch API للطلبات

## المساهمة

نرحب بمساهماتكم! إذا وجدت مشكلة أو لديك اقتراح لتحسين التطبيق:

1. قم بعمل Fork للمستودع
2. أنشئ فرع جديد لميزتك (`git checkout -b feature/amazing-feature`)
3. قم بإجراء تغييراتك وحفظها (`git commit -m 'إضافة ميزة رائعة'`)
4. ارفع التغييرات (`git push origin feature/amazing-feature`)
5. افتح طلب دمج (Pull Request)

## الترخيص

هذا المشروع مرخص تحت [MIT License](https://opensource.org/licenses/MIT). 