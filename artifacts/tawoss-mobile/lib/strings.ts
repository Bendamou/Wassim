export const ar = {
  appName: "تاووس",
  appTagline: "خدمات الحلاقة عند الطلب",
  heroLine1: "ابدُ بمظهر رائع.",
  heroLine2: "احجز كالمحترفين.",
  appVersion: "تاووس الإصدار 1.0 · ابدُ بمظهر رائع.",

  back: "رجوع",
  continue: "متابعة",
  cancel: "إلغاء",
  ok: "حسناً",
  error: "خطأ",
  notSet: "غير محدد",
  mad: "درهم",

  // Auth welcome
  whoAreYou: "من أنت؟",
  chooseRole: "اختر كيف تريد استخدام تاووس",
  alreadyHaveAccount: "هل لديك حساب بالفعل؟",
  signIn: "تسجيل الدخول",

  // Roles
  roleClient: "عميل",
  roleClientSub: "احجز خدمات الحلاقة بسعرك",
  roleSalon: "صاحب صالون",
  roleSalonSub: "سجّل محلّك وأدر الكراسي",
  rolePro: "حلاق محترف",
  roleProSub: "اختر خدماتك واستلم طلبات",

  // Credentials
  createAccount: "إنشاء حسابك",
  quickSetup: "إعداد سريع — 3 حقول فقط",
  fullName: "الاسم الكامل",
  fullNamePlaceholder: "أحمد بنعلي",
  gmailAddress: "بريد Gmail",
  gmailPlaceholder: "you@gmail.com",
  phoneNumber: "رقم الهاتف",
  phonePlaceholder: "0612 345 678",
  alreadyRegistered: "هل أنت مسجّل بالفعل؟",

  // Sign In
  welcomeBack: "مرحباً بعودتك",
  enterPhone: "أدخل رقم هاتفك للمتابعة",
  newHere: "جديد هنا؟",
  createAccountLink: "إنشاء حساب ←",
  phoneNotFound: "الهاتف غير موجود. أنشئ حساباً أولاً.",

  // Services
  serviceHaircut: "قص الشعر",
  serviceBeard: "تهذيب اللحية",
  serviceNails: "العناية بالأظافر",
  serviceFull: "الباقة الكاملة",

  // Status
  statusOpen: "مفتوح",
  statusInProgress: "جارٍ",
  statusCompleted: "مكتمل",
  statusCancelled: "ملغى",
  statusPending: "معلّق",
  statusAccepted: "مقبول",
  statusRejected: "مرفوض",
  statusClaimed: "محجوز",
  statusNoshow: "غائب",

  // Home — client
  goodMorning: "صباح الخير",
  goodAfternoon: "مساء الخير",
  goodEvening: "مساء النور",
  activeJobs: "وظائف نشطة",
  pendingBids: "عروض معلّقة",
  totalJobs: "إجمالي الوظائف",
  postNewJob: "نشر وظيفة جديدة",
  recentJobs: "الوظائف الأخيرة",
  noJobsYet: "لا وظائف بعد — انشر أولى وظائفك!",

  // Home — freelancer
  nearbyRequests: "الطلبات القريبة",
  live: "مباشر",
  noRequestsYet: "لا طلبات بعد",
  clientsPosting: "العملاء ينشرون — تحقق مجدداً قريباً",
  beTheFirst: "⚡ كن الأول!",
  openRequestsLabel: (n: number) =>
    `${n} طلب${n === 1 ? "" : "ات"} مفتوح${n === 1 ? "" : "ة"}`,
  bidsCount: (n: number) => `${n} عرض`,

  // Home — salon
  salonDashboard: "لوحة تحكم الصالون",
  goLive: "بث مباشر",
  youAreLive: "🟢 أنت الآن مباشر",
  clientsCanFind: "يمكن للعملاء إيجادك وحجزك",
  startAccepting: "ابدأ قبول الحجوزات المباشرة",
  earnedToday: "درهم مكتسب اليوم",
  liveQueueTitle: (n: number) => `الطابور المباشر (${n})`,
  noClaimsYet: "لا حجوزات بعد — شارك رابطك!",
  goLiveToStart: "ابدأ البث لقبول الحجوزات",

  // Explore
  topProfessionals: "أفضل المحترفين",
  noProfessionals: "لا محترفين بعد",
  allRequests: "جميع الطلبات",
  noRequests: "لا طلبات الآن",
  analytics: "التحليلات",
  analyticsComingSoon: "التحليلات التفصيلية قريباً",
  yourEarningsHere: "أرباحك وأنشطتك ستظهر هنا",
  todayRevenue: "إيرادات اليوم",
  thisWeek: "هذا الأسبوع",
  chairsBusy: "كراسي مشغولة",
  avgRating: "متوسط التقييم",
  jobs: "وظائف",
  jobsCount: (n: number) => `${n} وظيفة`,

  // Activity — client
  myJobs: "وظائفي",
  postFirstJob: "انشر أول وظيفة لك",
  cancelThisJob: "إلغاء هذه الوظيفة",
  cancelJobTitle: "إلغاء الوظيفة؟",
  cancelJobMsg: "لا يمكن التراجع عن هذا.",
  keepJob: "احتفظ بها",
  cancelJobConfirm: "إلغاء",
  couldNotCancel: "تعذّر الإلغاء",
  noBidsOnJob: "لا وظائف بعد",

  // Activity — freelancer
  myBids: "عروضي",
  availableJobs: (n: number) => `⚡ وظائف متاحة (${n})`,
  noBidsYet: "لا عروض بعد",
  browseToBid: "تصفح الوظائف أعلاه وضع عرضك الأول",
  yourBid: "عرضك",
  budget: "الميزانية",
  jobNum: (n: number) => `وظيفة #${n}`,
  couldNotBid: "تعذّر تقديم العرض",

  // Activity — salon
  chairQueueTitle: (n: number) => `طابور الكراسي (${n})`,
  queueEmpty: "الطابور فارغ",
  goLiveForQueue: "ابدأ البث من لوحة التحكم لقبول الحجوزات",
  chair: "كرسي",
  depositLabel: "مبلغ الحجز",
  clientNum: (n: number) => `عميل #${n}`,

  // Post Job
  postJobTitle: "نشر وظيفة",
  setYourPrice: "حدد سعرك — سيقدم المحترفون عروضهم",
  serviceLabel: "الخدمة",
  budgetLabel: "ميزانيتك (درهم)",
  locationLabel: "موقعك",
  locationPlaceholder: "12 شارع أم الربيع، الدار البيضاء",
  postJobBtn: "نشر الوظيفة",
  jobPosted: "تم نشر الوظيفة!",
  biddingStart: "سيبدأ المحترفون في تقديم عروضهم قريباً.",
  couldNotPost: "تعذّر نشر الوظيفة",

  // Profile
  email: "البريد الإلكتروني",
  phone: "الهاتف",
  location: "الموقع",
  account: "الحساب",
  editProfile: "تعديل الملف الشخصي",
  verifiedPro: "محترف موثّق",
  helpSupport: "المساعدة والدعم",
  signOut: "تسجيل الخروج",
  signOutTitle: "تسجيل الخروج؟",
  signOutMsg: "ستحتاج إلى تسجيل الدخول مجدداً.",

  // Role labels
  roleClientLabel: "عميل",
  roleProLabel: "حلاق محترف",
  roleSalonLabel: "صاحب صالون",

  // Tab bar
  tabHome: "الرئيسية",
  tabDashboard: "لوحة التحكم",
  tabExplore: "استكشاف",
  tabRequests: "الطلبات",
  tabMyJobs: "وظائفي",
  tabMyBids: "عروضي",
  tabQueue: "الطابور",
  tabPostJob: "نشر وظيفة",
  tabProfile: "الملف الشخصي",
};

export const SVC_LABEL_AR: Record<string, string> = {
  haircut: ar.serviceHaircut,
  beard: ar.serviceBeard,
  nails: ar.serviceNails,
  full_grooming: ar.serviceFull,
};

export const STATUS_LABEL_AR: Record<string, string> = {
  open: ar.statusOpen,
  in_progress: ar.statusInProgress,
  completed: ar.statusCompleted,
  cancelled: ar.statusCancelled,
  pending: ar.statusPending,
  accepted: ar.statusAccepted,
  rejected: ar.statusRejected,
  claimed: ar.statusClaimed,
  noshow: ar.statusNoshow,
};
