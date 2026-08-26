"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type Purchase = {
  id: number;
  date: string;
  seller: string;
  description: string;
  amount: number;
  payment: string;
  invoiceNumber?: string | null;
  invoiceImage?: string | null;
  notes?: string | null;
  status: string;
  createdAt?: string;
};

type Payment = {
  id: number;
  date: string;
  title: string;
  amount: number;
  method: string;
  description?: string | null;
  receiptImage?: string | null;
  notes?: string | null;
  createdAt?: string;
};

type Report = {
  summary: {
    purchaseCount: number;
    purchaseTotal: number;
    paymentCount: number;
    paymentTotal: number;
    balance: number;
  };
  purchases: Purchase[];
  payments: Payment[];
};

type JalaliDate = {
  year: number;
  month: number;
  day: number;
};

/* =========================================================
   MENU
========================================================= */

const menuItems = [
  {
    id: "dashboard",
    title: "داشبورد",
    icon: "🏠",
  },
  {
    id: "purchase",
    title: "ثبت خرید",
    icon: "➕",
  },
  {
    id: "invoice",
    title: "فاکتورها",
    icon: "🧾",
  },
  {
    id: "payment",
    title: "واریزها",
    icon: "💳",
  },
  {
    id: "report",
    title: "گزارش‌ها",
    icon: "📊",
  },
];

/* =========================================================
   MONEY
========================================================= */

function formatMoney(value: number) {
  return new Intl.NumberFormat("fa-IR").format(
    Number(value || 0)
  );
}

/* =========================================================
   GREGORIAN / JALALI
========================================================= */

function div(a: number, b: number) {
  return Math.floor(a / b);
}

function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number
): JalaliDate {
  const gdm = [
    0,
    31,
    59,
    90,
    120,
    151,
    181,
    212,
    243,
    273,
    304,
    334,
  ];

  let gy2 = gm > 2 ? gy + 1 : gy;

  let days =
    355666 +
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) +
    gd +
    gdm[gm - 1];

  let jy = -1595 + 33 * div(days, 12053);

  days %= 12053;

  jy += 4 * div(days, 1461);

  days %= 1461;

  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  let jm =
    days < 186
      ? 1 + div(days, 31)
      : 7 + div(days - 186, 30);

  let jd =
    1 +
    (days < 186
      ? days % 31
      : (days - 186) % 30);

  return {
    year: jy,
    month: jm,
    day: jd,
  };
}

function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number
) {
  jy += 1595;

  let days =
    -355668 +
    365 * jy +
    div(jy, 33) * 8 +
    div((jy % 33) + 3, 4) +
    jd +
    (jm < 7
      ? (jm - 1) * 31
      : (jm - 7) * 30 + 186);

  let gy = 400 * div(days, 146097);

  days %= 146097;

  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;

    if (days >= 365) {
      days++;
    }
  }

  gy += 4 * div(days, 1461);

  days %= 1461;

  if (days > 365) {
    gy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;

  const sal_a = [
    0,
    31,
    (gy % 4 === 0 &&
    (gy % 100 !== 0 || gy % 400 === 0)
      ? 29
      : 28),
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let gm = 0;

  while (
    gm < 13 &&
    gd > sal_a[gm]
  ) {
    gd -= sal_a[gm];
    gm++;
  }

  return {
    year: gy,
    month: gm,
    day: gd,
  };
}

/* =========================================================
   DATE HELPERS
========================================================= */

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function gregorianStringToJalali(
  value: string
) {
  if (!value) return "-";

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

  if (!match) {
    return value;
  }

  const gy = Number(match[1]);
  const gm = Number(match[2]);
  const gd = Number(match[3]);

  const j = gregorianToJalali(
    gy,
    gm,
    gd
  );

  return `${j.year}/${pad2(
    j.month
  )}/${pad2(j.day)}`;
}

function gregorianToJalaliText(
  value: string
) {
  return gregorianStringToJalali(value);
}

function todayGregorian() {
  const now = new Date();

  return `${now.getFullYear()}-${pad2(
    now.getMonth() + 1
  )}-${pad2(now.getDate())}`;
}

function todayJalali(): JalaliDate {
  const now = new Date();

  return gregorianToJalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
}

function jalaliToGregorianString(
  date: JalaliDate
) {
  const g = jalaliToGregorian(
    date.year,
    date.month,
    date.day
  );

  return `${g.year}-${pad2(
    g.month
  )}-${pad2(g.day)}`;
}

/* =========================================================
   JALALI MONTHS
========================================================= */

const jalaliMonths = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const weekDays = [
  "ش",
  "ی",
  "د",
  "س",
  "چ",
  "پ",
  "ج",
];

function isJalaliLeapYear(year: number) {
  const g1 = jalaliToGregorian(
    year,
    12,
    29
  );

  const g2 = jalaliToGregorian(
    year,
    12,
    30
  );

  return g1.year !== g2.year ||
    g1.month !== g2.month ||
    g1.day !== g2.day;
}

function jalaliMonthDays(
  year: number,
  month: number
) {
  if (month <= 6) return 31;

  if (month <= 11) return 30;

  return isJalaliLeapYear(year)
    ? 30
    : 29;
}

/* =========================================================
   JALALI DATE PICKER
========================================================= */

function JalaliDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const currentJalali = useMemo(() => {
    if (!value) {
      return todayJalali();
    }

    const parts = value.split("-");

    if (parts.length !== 3) {
      return todayJalali();
    }

    return gregorianToJalali(
      Number(parts[0]),
      Number(parts[1]),
      Number(parts[2])
    );
  }, [value]);

  const [open, setOpen] =
    useState(false);

  const [viewYear, setViewYear] =
    useState(currentJalali.year);

  const [viewMonth, setViewMonth] =
    useState(currentJalali.month);

  useEffect(() => {
    setViewYear(currentJalali.year);
    setViewMonth(currentJalali.month);
  }, [
    currentJalali.year,
    currentJalali.month,
  ]);

  const firstGregorian =
    jalaliToGregorianString({
      year: viewYear,
      month: viewMonth,
      day: 1,
    });

  const firstDate =
    new Date(`${firstGregorian}T12:00:00`);

  /*
    JS:
    Sunday = 0
    Saturday = 6

    تقویم شمسی:
    شنبه = 0
    یکشنبه = 1
    ...
    جمعه = 6
  */

  const jsDay = firstDate.getDay();

  const firstDay =
    (jsDay + 1) % 7;

  const daysInMonth =
    jalaliMonthDays(
      viewYear,
      viewMonth
    );

  const calendarCells: Array<
    number | null
  > = [];

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    calendarCells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarCells.push(day);
  }

  while (
    calendarCells.length % 7 !== 0
  ) {
    calendarCells.push(null);
  }

  const selectDay = (day: number) => {
    const selected =
      jalaliToGregorianString({
        year: viewYear,
        month: viewMonth,
        day,
      });

    onChange(selected);
    setOpen(false);
  };

  const previousMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(
        (year) => year - 1
      );
    } else {
      setViewMonth(
        (month) => month - 1
      );
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(
        (year) => year + 1
      );
    } else {
      setViewMonth(
        (month) => month + 1
      );
    }
  };

  const goToday = () => {
    const today = todayJalali();

    setViewYear(today.year);
    setViewMonth(today.month);

    onChange(
      jalaliToGregorianString(today)
    );
  };

  const selected =
    currentJalali.year === viewYear &&
    currentJalali.month === viewMonth
      ? currentJalali.day
      : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((old) => !old)
        }
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-right outline-none transition hover:border-slate-400"
      >
        <span>
          {value
            ? gregorianToJalaliText(value)
            : "انتخاب تاریخ"}
        </span>

        <span className="text-lg">
          📅
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-full min-w-[310px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg px-3 py-2 hover:bg-slate-100"
            >
              ←
            </button>

            <div className="text-center">
              <div className="font-bold">
                {jalaliMonths[
                  viewMonth - 1
                ]}
              </div>

              <div className="text-xs text-slate-500">
                {formatMoney(viewYear)}
              </div>
            </div>

            <button
              type="button"
              onClick={previousMonth}
              className="rounded-lg px-3 py-2 hover:bg-slate-100"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-2 text-xs font-bold text-slate-400"
              >
                {day}
              </div>
            ))}

            {calendarCells.map(
              (day, index) => (
                <div
                  key={`${day}-${index}`}
                  className="flex justify-center"
                >
                  {day ? (
                    <button
                      type="button"
                      onClick={() =>
                        selectDay(day)
                      }
                      className={`h-9 w-9 rounded-lg text-sm transition ${
                        selected === day
                          ? "bg-slate-900 text-white"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      {formatMoney(day)}
                    </button>
                  ) : (
                    <span className="h-9 w-9" />
                  )}
                </div>
              )
            )}
          </div>

          <button
            type="button"
            onClick={goToday}
            className="mt-4 w-full rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            امروز
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   IMAGE PICKER
========================================================= */

function ImagePicker({
  value,
  onChange,
  title,
}: {
  value: string;
  onChange: (value: string) => void;
  title: string;
}) {
  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("لطفاً فقط فایل تصویری انتخاب کنید.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "حجم عکس نباید بیشتر از ۵ مگابایت باشد."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result =
        reader.result;

      if (typeof result === "string") {
        onChange(result);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {title}
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
      />

      {value && (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img
            src={value}
            alt={title}
            className="max-h-64 w-full object-contain"
          />

          <button
            type="button"
            onClick={() => onChange("")}
            className="w-full border-t border-slate-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
          >
            حذف عکس
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   IMAGE MODAL
========================================================= */

function ImageModal({
  image,
  title,
  onClose,
}: {
  image: string;
  title: string;
  onClose: () => void;
}) {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[95vh] max-w-5xl rounded-2xl bg-white p-3 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-10 rounded-full bg-black/70 px-3 py-2 text-white"
        >
          ✕
        </button>

        <img
          src={image}
          alt={title}
          className="max-h-[90vh] max-w-full rounded-xl object-contain"
        />
      </div>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

export default function Home() {
  const [active, setActive] =
    useState("dashboard");

  const [purchases, setPurchases] =
    useState<Purchase[]>([]);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [range, setRange] =
    useState("month");

  const [report, setReport] =
    useState<Report | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [
    editingPurchaseId,
    setEditingPurchaseId,
  ] = useState<number | null>(null);

  const [
    selectedImage,
    setSelectedImage,
  ] = useState("");

  const [
    selectedImageTitle,
    setSelectedImageTitle,
  ] = useState("");

  const [
    purchaseForm,
    setPurchaseForm,
  ] = useState({
    date: todayGregorian(),
    seller: "",
    description: "",
    amount: "",
    payment: "کارت",
    invoiceNumber: "",
    invoiceImage: "",
    notes: "",
  });

  const [
    paymentForm,
    setPaymentForm,
  ] = useState({
    date: todayGregorian(),
    title: "",
    amount: "",
    method: "کارت",
    description: "",
    receiptImage: "",
    notes: "",
  });

  /* =====================================================
     TOTALS
  ===================================================== */

  const purchaseTotal = useMemo(() => {
    return purchases.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
  }, [purchases]);

  const paymentTotal = useMemo(() => {
    return payments.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
  }, [payments]);

  const balance =
    purchaseTotal - paymentTotal;

  /* =====================================================
     LOAD PURCHASES
  ===================================================== */

  const loadPurchases = async () => {
    try {
      const response = await fetch(
        "/api/purchases",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (result.success) {
        setPurchases(
          result.data || []
        );
      } else {
        setMessage(
          result.message ||
            "خطا در دریافت خریدها"
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "خطا در دریافت خریدها"
      );
    }
  };

  /* =====================================================
     LOAD PAYMENTS
  ===================================================== */

  const loadPayments = async () => {
    try {
      const response = await fetch(
        "/api/payments",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (result.success) {
        setPayments(
          result.data || []
        );
      } else {
        setMessage(
          result.message ||
            "خطا در دریافت واریزها"
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "خطا در دریافت واریزها"
      );
    }
  };

  /* =====================================================
     LOAD REPORT
  ===================================================== */

  const loadReport = async (
    selectedRange = range
  ) => {
    setLoading(true);

    try {
      const response =
        await fetch(
          `/api/reports?range=${selectedRange}`,
          {
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setReport(result);
      } else {
        setMessage(
          result.message ||
            "خطا در دریافت گزارش"
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "خطا در ارتباط با سرور"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadPurchases();
    loadPayments();
    loadReport("month");
  }, []);

  /* =====================================================
     START EDIT PURCHASE
  ===================================================== */

  const startEditPurchase = (
    purchase: Purchase
  ) => {
    setEditingPurchaseId(
      purchase.id
    );

    setPurchaseForm({
      date:
        purchase.date ||
        todayGregorian(),

      seller:
        purchase.seller || "",

      description:
        purchase.description || "",

      amount:
        String(
          purchase.amount || ""
        ),

      payment:
        purchase.payment || "کارت",

      invoiceNumber:
        purchase.invoiceNumber || "",

      invoiceImage:
        purchase.invoiceImage || "",

      notes:
        purchase.notes || "",
    });

    setActive("purchase");

    setMessage(
      "خرید برای ویرایش آماده شد."
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     CANCEL EDIT
  ===================================================== */

  const cancelEditPurchase = () => {
    setEditingPurchaseId(null);

    setPurchaseForm({
      date: todayGregorian(),
      seller: "",
      description: "",
      amount: "",
      payment: "کارت",
      invoiceNumber: "",
      invoiceImage: "",
      notes: "",
    });

    setMessage(
      "ویرایش لغو شد."
    );
  };

  /* =====================================================
     PURCHASE SUBMIT
  ===================================================== */

  const handlePurchaseSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setMessage("");

    const amount =
      Number(purchaseForm.amount);

    if (
      !purchaseForm.seller.trim()
    ) {
      setMessage(
        "نام فروشنده را وارد کنید."
      );
      return;
    }

    if (
      !purchaseForm.description.trim()
    ) {
      setMessage(
        "شرح خرید را وارد کنید."
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setMessage(
        "مبلغ خرید صحیح نیست."
      );
      return;
    }

    /*
      نکته مهم:
      isEditing قبل از try تعریف شده
      تا داخل catch نیز قابل استفاده باشد.
    */
    const isEditing =
      editingPurchaseId !== null;

    try {
      const response =
        await fetch(
          "/api/purchases",
          {
            method: isEditing
              ? "PUT"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...(isEditing
                ? {
                    id: editingPurchaseId,
                  }
                : {}),

              date:
                purchaseForm.date,

              seller:
                purchaseForm.seller,

              description:
                purchaseForm.description,

              amount,

              payment:
                purchaseForm.payment,

              invoiceNumber:
                purchaseForm.invoiceNumber,

              invoiceImage:
                purchaseForm.invoiceImage,

              notes:
                purchaseForm.notes,
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setMessage(
          result.message ||
            (isEditing
              ? "ویرایش خرید انجام نشد."
              : "ثبت خرید انجام نشد.")
        );

        return;
      }

      setMessage(
        isEditing
          ? "خرید با موفقیت ویرایش شد."
          : "خرید با موفقیت ثبت شد."
      );

      setEditingPurchaseId(
        null
      );

      setPurchaseForm({
        date: todayGregorian(),
        seller: "",
        description: "",
        amount: "",
        payment: "کارت",
        invoiceNumber: "",
        invoiceImage: "",
        notes: "",
      });

      await loadPurchases();
      await loadReport(range);

      setActive("invoice");
    } catch (error) {
      console.error(error);

      setMessage(
        isEditing
          ? "خطا در ویرایش خرید"
          : "خطا در ثبت خرید"
      );
    }
  };

  /* =====================================================
     DELETE PURCHASE
  ===================================================== */

  const deletePurchase = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "آیا از حذف این خرید مطمئن هستید؟"
      );

    if (!confirmed) return;

    try {
      const response =
        await fetch(
          "/api/purchases",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id,
            }),
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setMessage(
          "خرید حذف شد."
        );

        await loadPurchases();
        await loadReport(range);
      } else {
        setMessage(
          result.message ||
            "حذف انجام نشد."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "خطا در حذف خرید"
      );
    }
  };

  /* =====================================================
     PAYMENT SUBMIT
  ===================================================== */

  const handlePaymentSubmit =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      setMessage("");

      const amount =
        Number(paymentForm.amount);

      if (
        !paymentForm.title.trim()
      ) {
        setMessage(
          "عنوان واریز را وارد کنید."
        );
        return;
      }

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        setMessage(
          "مبلغ واریز صحیح نیست."
        );
        return;
      }

      try {
        const response =
          await fetch(
            "/api/payments",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                date:
                  paymentForm.date,

                title:
                  paymentForm.title,

                amount,

                method:
                  paymentForm.method,

                description:
                  paymentForm.description,

                receiptImage:
                  paymentForm.receiptImage,

                notes:
                  paymentForm.notes,
              }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          setMessage(
            result.message ||
              "ثبت واریز انجام نشد."
          );

          return;
        }

        setMessage(
          "واریز با موفقیت ثبت شد."
        );

        setPaymentForm({
          date: todayGregorian(),
          title: "",
          amount: "",
          method: "کارت",
          description: "",
          receiptImage: "",
          notes: "",
        });

        await loadPayments();
        await loadReport(range);
      } catch (error) {
        console.error(error);

        setMessage(
          "خطا در ثبت واریز"
        );
      }
    };

  /* =====================================================
     DELETE PAYMENT
  ===================================================== */

  const deletePayment = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "آیا از حذف این واریز مطمئن هستید؟"
      );

    if (!confirmed) return;

    try {
      const response =
        await fetch(
          "/api/payments",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id,
            }),
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setMessage(
          "واریز حذف شد."
        );

        await loadPayments();
        await loadReport(range);
      } else {
        setMessage(
          result.message ||
            "حذف انجام نشد."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "خطا در حذف واریز"
      );
    }
  };

  /* =====================================================
     RANGE
  ===================================================== */

  const changeRange = async (
    newRange: string
  ) => {
    setRange(newRange);

    await loadReport(
      newRange
    );
  };

  /* =====================================================
     IMAGE MODAL
  ===================================================== */

  const showImage = (
    image: string,
    title: string
  ) => {
    setSelectedImage(image);
    setSelectedImageTitle(title);
  };

  const closeImage = () => {
    setSelectedImage("");
    setSelectedImageTitle("");
  };

  /* =====================================================
     REPORT TEXT
  ===================================================== */

  const reportText = report
    ? [
        "گزارش خرید و هزینه شرکت",
        "------------------------------",

        `بازه: ${
          range === "today"
            ? "امروز"
            : range === "week"
            ? "این هفته"
            : "این ماه"
        }`,

        "",

        `تعداد خریدها: ${formatMoney(
          report.summary.purchaseCount
        )}`,

        `جمع خرید: ${formatMoney(
          report.summary.purchaseTotal
        )} تومان`,

        "",

        `تعداد واریزها: ${formatMoney(
          report.summary.paymentCount
        )}`,

        `جمع واریز: ${formatMoney(
          report.summary.paymentTotal
        )} تومان`,

        "",

        `مانده: ${formatMoney(
          report.summary.balance
        )} تومان`,

        "",

        "خریدها:",

        ...report.purchases.map(
          (item) =>
            `${gregorianToJalaliText(
              item.date
            )} - ${
              item.seller
            } - ${
              item.description
            } - ${formatMoney(
              item.amount
            )} تومان`
        ),

        "",

        "واریزها:",

        ...report.payments.map(
          (item) =>
            `${gregorianToJalaliText(
              item.date
            )} - ${
              item.title
            } - ${formatMoney(
              item.amount
            )} تومان`
        ),
      ].join("\n")
    : "";

  /* =====================================================
     COPY REPORT
  ===================================================== */

  const copyReport = async () => {
    if (!reportText) return;

    try {
      await navigator.clipboard.writeText(
        reportText
      );

      setMessage(
        "گزارش کپی شد و آماده ارسال است."
      );
    } catch {
      setMessage(
        "کپی گزارش انجام نشد."
      );
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 text-slate-900"
    >
      <div className="mx-auto min-h-screen max-w-7xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-5 py-5 md:px-8">
            <div>
              <h1 className="text-xl font-bold md:text-2xl">
                خرید و هزینه شرکت
              </h1>

              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                مدیریت خرید، فاکتورها و واریزها
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                cancelEditPurchase();
                setActive("purchase");
              }}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              + ثبت خرید
            </button>
          </div>
        </header>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="border-b border-slate-200 bg-white">
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {menuItems.map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setActive(item.id)
                  }
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ${
                    active === item.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span className="ml-2">
                    {item.icon}
                  </span>

                  {item.title}
                </button>
              )
            )}
          </div>
        </nav>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="mx-5 mt-5 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm md:mx-8">
            <span>{message}</span>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
              className="mr-3 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        )}

        <section className="p-5 md:p-8">
          {/* =================================================
              DASHBOARD
          ================================================= */}

          {active === "dashboard" && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  داشبورد
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  خلاصه وضعیت خرید و واریزها
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    تعداد خریدها
                  </p>

                  <p className="mt-3 text-2xl font-bold">
                    {formatMoney(
                      purchases.length
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    خرید ثبت شده
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    جمع کل خرید
                  </p>

                  <p className="mt-3 text-2xl font-bold">
                    {formatMoney(
                      purchaseTotal
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    تومان
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    جمع واریزها
                  </p>

                  <p className="mt-3 text-2xl font-bold">
                    {formatMoney(
                      paymentTotal
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    تومان
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    مانده
                  </p>

                  <p className="mt-3 text-2xl font-bold">
                    {formatMoney(balance)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    تومان
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">
                        آخرین خریدها
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        آخرین فاکتورهای ثبت‌شده
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActive("invoice")
                      }
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs hover:bg-slate-200"
                    >
                      همه
                    </button>
                  </div>

                  <div className="space-y-3">
                    {purchases
                      .slice(0, 5)
                      .map(
                        (purchase) => (
                          <div
                            key={
                              purchase.id
                            }
                            className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {
                                  purchase.seller
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {gregorianToJalaliText(
                                  purchase.date
                                )}
                              </p>
                            </div>

                            <div className="text-sm font-bold">
                              {formatMoney(
                                purchase.amount
                              )}{" "}
                              تومان
                            </div>
                          </div>
                        )
                      )}

                    {purchases.length ===
                      0 && (
                      <p className="py-5 text-center text-sm text-slate-400">
                        هنوز خریدی ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">
                        آخرین واریزها
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        آخرین واریزهای ثبت‌شده
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActive("payment")
                      }
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs hover:bg-slate-200"
                    >
                      همه
                    </button>
                  </div>

                  <div className="space-y-3">
                    {payments
                      .slice(0, 5)
                      .map(
                        (payment) => (
                          <div
                            key={
                              payment.id
                            }
                            className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {
                                  payment.title
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {gregorianToJalaliText(
                                  payment.date
                                )}
                              </p>
                            </div>

                            <div className="text-sm font-bold">
                              {formatMoney(
                                payment.amount
                              )}{" "}
                              تومان
                            </div>
                          </div>
                        )
                      )}

                    {payments.length ===
                      0 && (
                      <p className="py-5 text-center text-sm text-slate-400">
                        هنوز واریزی ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =================================================
              PURCHASE FORM
          ================================================= */}

          {active === "purchase" && (
            <div className="mx-auto max-w-4xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {editingPurchaseId
                    ? "✏️ ویرایش خرید"
                    : "ثبت خرید جدید"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingPurchaseId
                    ? "اطلاعات خرید را اصلاح کنید."
                    : "اطلاعات خرید را وارد کنید."}
                </p>
              </div>

              <form
                onSubmit={
                  handlePurchaseSubmit
                }
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* DATE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      تاریخ خرید
                    </label>

                    <JalaliDatePicker
                      value={
                        purchaseForm.date
                      }
                      onChange={(date) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          date,
                        })
                      }
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      تاریخ انتخاب‌شده:
                      <span className="mr-1 font-bold text-slate-700">
                        {gregorianToJalaliText(
                          purchaseForm.date
                        )}
                      </span>
                    </p>
                  </div>

                  {/* SELLER */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      فروشنده
                    </label>

                    <input
                      required
                      value={
                        purchaseForm.seller
                      }
                      onChange={(event) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          seller:
                            event.target.value,
                        })
                      }
                      placeholder="نام فروشنده"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      شرح خرید
                    </label>

                    <input
                      required
                      value={
                        purchaseForm.description
                      }
                      onChange={(event) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          description:
                            event.target.value,
                        })
                      }
                      placeholder="مثلاً خرید لوازم اداری"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                    />
                  </div>

                  {/* AMOUNT */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      مبلغ
                    </label>

                    <input
                      required
                      type="number"
                      min="1"
                      value={
                        purchaseForm.amount
                      }
                      onChange={(event) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          amount:
                            event.target.value,
                        })
                      }
                      placeholder="مبلغ به تومان"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                    />
                  </div>

                  {/* PAYMENT */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      روش پرداخت
                    </label>

                    <select
                      value={
                        purchaseForm.payment
                      }
                      onChange={(event) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          payment:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <option>
                        کارت
                      </option>
                      <option>
                        نقدی
                      </option>
                      <option>
                        حساب بانکی
                      </option>
                      <option>
                        چک
                      </option>
                    </select>
                  </div>

                  {/* INVOICE NUMBER */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      شماره فاکتور
                    </label>

                    <input
                      value={
                        purchaseForm.invoiceNumber
                      }
                      onChange={(event) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          invoiceNumber:
                            event.target.value,
                        })
                      }
                      placeholder="اختیاری"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    />
                  </div>

                  {/* NOTES */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      توضیحات
                    </label>

                    <input
                      value={
                        purchaseForm.notes
                      }
                      onChange={(event) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          notes:
                            event.target.value,
                        })
                      }
                      placeholder="اختیاری"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    />
                  </div>

                  {/* INVOICE IMAGE */}

                  <div className="md:col-span-2">
                    <ImagePicker
                      title="📷 عکس فاکتور"
                      value={
                        purchaseForm.invoiceImage
                      }
                      onChange={(image) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          invoiceImage:
                            image,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
                  >
                    {editingPurchaseId
                      ? "💾 ذخیره تغییرات"
                      : "💾 ذخیره خرید"}
                  </button>

                  {editingPurchaseId && (
                    <button
                      type="button"
                      onClick={
                        cancelEditPurchase
                      }
                      className="rounded-xl bg-slate-100 px-5 py-3 font-medium text-slate-700 hover:bg-slate-200"
                    >
                      لغو ویرایش
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* =================================================
              INVOICES
          ================================================= */}

          {active === "invoice" && (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">
                    فاکتورها
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    تمام خریدهای ذخیره‌شده
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    cancelEditPurchase();
                    setActive("purchase");
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white"
                >
                  + ثبت خرید
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px] text-right text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-5 py-4">
                          تاریخ
                        </th>

                        <th className="px-5 py-4">
                          فروشنده
                        </th>

                        <th className="px-5 py-4">
                          شرح
                        </th>

                        <th className="px-5 py-4">
                          مبلغ
                        </th>

                        <th className="px-5 py-4">
                          پرداخت
                        </th>

                        <th className="px-5 py-4">
                          فاکتور
                        </th>

                        <th className="px-5 py-4">
                          عملیات
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {purchases.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-12 text-center text-slate-400"
                          >
                            هنوز خریدی ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        purchases.map(
                          (purchase) => (
                            <tr
                              key={
                                purchase.id
                              }
                              className="border-t border-slate-100"
                            >
                              <td className="px-5 py-4 text-xs font-medium">
                                {gregorianToJalaliText(
                                  purchase.date
                                )}
                              </td>

                              <td className="px-5 py-4 font-medium">
                                {
                                  purchase.seller
                                }
                              </td>

                              <td className="px-5 py-4 text-slate-500">
                                {
                                  purchase.description
                                }
                              </td>

                              <td className="px-5 py-4 font-bold">
                                {formatMoney(
                                  purchase.amount
                                )}{" "}
                                تومان
                              </td>

                              <td className="px-5 py-4">
                                {
                                  purchase.payment
                                }
                              </td>

                              <td className="px-5 py-4">
                                {purchase.invoiceImage ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      showImage(
                                        purchase.invoiceImage!,
                                        "عکس فاکتور"
                                      )
                                    }
                                    className="group relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200"
                                  >
                                    <img
                                      src={
                                        purchase.invoiceImage
                                      }
                                      alt="فاکتور"
                                      className="h-full w-full object-cover transition group-hover:scale-110"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    بدون عکس
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditPurchase(
                                        purchase
                                      )
                                    }
                                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-800"
                                  >
                                    ✏️ ویرایش
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deletePurchase(
                                        purchase.id
                                      )
                                    }
                                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs hover:bg-slate-200"
                                  >
                                    🗑️ حذف
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              PAYMENTS
          ================================================= */}

          {active === "payment" && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  واریزها
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ثبت و مدیریت واریزهای شرکت
                </p>
              </div>

              <form
                onSubmit={
                  handlePaymentSubmit
                }
                className="mb-8 rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* DATE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      تاریخ واریز
                    </label>

                    <JalaliDatePicker
                      value={
                        paymentForm.date
                      }
                      onChange={(date) =>
                        setPaymentForm({
                          ...paymentForm,
                          date,
                        })
                      }
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      تاریخ انتخاب‌شده:
                      <span className="mr-1 font-bold text-slate-700">
                        {gregorianToJalaliText(
                          paymentForm.date
                        )}
                      </span>
                    </p>
                  </div>

                  {/* TITLE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      عنوان واریز
                    </label>

                    <input
                      required
                      value={
                        paymentForm.title
                      }
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          title:
                            event.target.value,
                        })
                      }
                      placeholder="مثلاً واریز مدیر"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    />
                  </div>

                  {/* AMOUNT */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      مبلغ
                    </label>

                    <input
                      required
                      type="number"
                      min="1"
                      value={
                        paymentForm.amount
                      }
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          amount:
                            event.target.value,
                        })
                      }
                      placeholder="مبلغ به تومان"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    />
                  </div>

                  {/* METHOD */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      روش واریز
                    </label>

                    <select
                      value={
                        paymentForm.method
                      }
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          method:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <option>
                        کارت
                      </option>

                      <option>
                        حساب بانکی
                      </option>

                      <option>
                        نقدی
                      </option>

                      <option>
                        چک
                      </option>
                    </select>
                  </div>

                  {/* DESCRIPTION */}

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      توضیحات
                    </label>

                    <input
                      value={
                        paymentForm.description
                      }
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          description:
                            event.target.value,
                        })
                      }
                      placeholder="اختیاری"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    />
                  </div>

                  {/* RECEIPT IMAGE */}

                  <div className="md:col-span-2">
                    <ImagePicker
                      title="📷 عکس رسید واریز"
                      value={
                        paymentForm.receiptImage
                      }
                      onChange={(image) =>
                        setPaymentForm({
                          ...paymentForm,
                          receiptImage:
                            image,
                        })
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
                >
                  💾 ثبت واریز
                </button>
              </form>

              {/* PAYMENT TABLE */}

              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-right text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-5 py-4">
                          تاریخ
                        </th>

                        <th className="px-5 py-4">
                          عنوان
                        </th>

                        <th className="px-5 py-4">
                          مبلغ
                        </th>

                        <th className="px-5 py-4">
                          روش
                        </th>

                        <th className="px-5 py-4">
                          رسید
                        </th>

                        <th className="px-5 py-4">
                          عملیات
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {payments.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-12 text-center text-slate-400"
                          >
                            هنوز واریزی ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        payments.map(
                          (payment) => (
                            <tr
                              key={
                                payment.id
                              }
                              className="border-t border-slate-100"
                            >
                              <td className="px-5 py-4 text-xs font-medium">
                                {gregorianToJalaliText(
                                  payment.date
                                )}
                              </td>

                              <td className="px-5 py-4 font-medium">
                                {
                                  payment.title
                                }
                              </td>

                              <td className="px-5 py-4 font-bold">
                                {formatMoney(
                                  payment.amount
                                )}{" "}
                                تومان
                              </td>

                              <td className="px-5 py-4">
                                {
                                  payment.method
                                }
                              </td>

                              <td className="px-5 py-4">
                                {payment.receiptImage ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      showImage(
                                        payment.receiptImage!,
                                        "عکس رسید واریز"
                                      )
                                    }
                                    className="group relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200"
                                  >
                                    <img
                                      src={
                                        payment.receiptImage
                                      }
                                      alt="رسید واریز"
                                      className="h-full w-full object-cover transition group-hover:scale-110"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    بدون عکس
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    deletePayment(
                                      payment.id
                                    )
                                  }
                                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs hover:bg-slate-200"
                                >
                                  🗑️ حذف
                                </button>
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              REPORT
          ================================================= */}

          {active === "report" && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  گزارش خرید و هزینه
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  گزارش خریدها و واریزهای ثبت‌شده
                </p>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    changeRange("today")
                  }
                  className={`rounded-xl px-5 py-2.5 text-sm ${
                    range === "today"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  امروز
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeRange("week")
                  }
                  className={`rounded-xl px-5 py-2.5 text-sm ${
                    range === "week"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  این هفته
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeRange("month")
                  }
                  className={`rounded-xl px-5 py-2.5 text-sm ${
                    range === "month"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  این ماه
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadReport(range)
                  }
                  className="rounded-xl bg-white px-5 py-2.5 text-sm"
                >
                  🔄 بروزرسانی
                </button>
              </div>

              {loading ? (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                  در حال دریافت اطلاعات...
                </div>
              ) : report ? (
                <>
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">
                        تعداد خریدها
                      </p>

                      <p className="mt-3 text-2xl font-bold">
                        {formatMoney(
                          report.summary
                            .purchaseCount
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">
                        جمع کل خرید
                      </p>

                      <p className="mt-3 text-2xl font-bold">
                        {formatMoney(
                          report.summary
                            .purchaseTotal
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        تومان
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">
                        جمع واریز
                      </p>

                      <p className="mt-3 text-2xl font-bold">
                        {formatMoney(
                          report.summary
                            .paymentTotal
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        تومان
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">
                        مانده
                      </p>

                      <p className="mt-3 text-2xl font-bold">
                        {formatMoney(
                          report.summary
                            .balance
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        تومان
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold">
                          گزارش{" "}
                          {range ===
                          "today"
                            ? "امروز"
                            : range ===
                              "week"
                            ? "این هفته"
                            : "این ماه"}
                        </h3>

                        <p className="mt-2 text-xs text-slate-500">
                          جمع خرید:
                          <span className="mr-1 font-bold">
                            {formatMoney(
                              report.summary
                                .purchaseTotal
                            )}{" "}
                            تومان
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          جمع واریز:
                          <span className="mr-1 font-bold">
                            {formatMoney(
                              report.summary
                                .paymentTotal
                            )}{" "}
                            تومان
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          copyReport
                        }
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-white"
                      >
                        📋 کپی گزارش
                      </button>
                    </div>
                  </div>

                  {/* REPORT PURCHASES */}

                  <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5">
                      <h3 className="font-bold">
                        جزئیات خریدها
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[850px] text-right text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="px-5 py-4">
                              تاریخ
                            </th>

                            <th className="px-5 py-4">
                              فروشنده
                            </th>

                            <th className="px-5 py-4">
                              شرح
                            </th>

                            <th className="px-5 py-4">
                              مبلغ
                            </th>

                            <th className="px-5 py-4">
                              فاکتور
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {report
                            .purchases
                            .length ===
                          0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-5 py-10 text-center text-slate-400"
                              >
                                در این بازه خریدی ثبت نشده است.
                              </td>
                            </tr>
                          ) : (
                            report.purchases.map(
                              (
                                purchase
                              ) => (
                                <tr
                                  key={
                                    purchase.id
                                  }
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-5 py-4">
                                    {gregorianToJalaliText(
                                      purchase.date
                                    )}
                                  </td>

                                  <td className="px-5 py-4">
                                    {
                                      purchase.seller
                                    }
                                  </td>

                                  <td className="px-5 py-4 text-slate-500">
                                    {
                                      purchase.description
                                    }
                                  </td>

                                  <td className="px-5 py-4 font-bold">
                                    {formatMoney(
                                      purchase.amount
                                    )}{" "}
                                    تومان
                                  </td>

                                  <td className="px-5 py-4">
                                    {purchase.invoiceImage ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          showImage(
                                            purchase.invoiceImage!,
                                            "فاکتور"
                                          )
                                        }
                                        className="h-12 w-12 overflow-hidden rounded-lg border"
                                      >
                                        <img
                                          src={
                                            purchase.invoiceImage
                                          }
                                          alt="فاکتور"
                                          className="h-full w-full object-cover"
                                        />
                                      </button>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* REPORT PAYMENTS */}

                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5">
                      <h3 className="font-bold">
                        جزئیات واریزها
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] text-right text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="px-5 py-4">
                              تاریخ
                            </th>

                            <th className="px-5 py-4">
                              عنوان
                            </th>

                            <th className="px-5 py-4">
                              مبلغ
                            </th>

                            <th className="px-5 py-4">
                              روش
                            </th>

                            <th className="px-5 py-4">
                              رسید
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {report
                            .payments
                            .length ===
                          0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-5 py-10 text-center text-slate-400"
                              >
                                در این بازه واریزی ثبت نشده است.
                              </td>
                            </tr>
                          ) : (
                            report.payments.map(
                              (
                                payment
                              ) => (
                                <tr
                                  key={
                                    payment.id
                                  }
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-5 py-4">
                                    {gregorianToJalaliText(
                                      payment.date
                                    )}
                                  </td>

                                  <td className="px-5 py-4">
                                    {
                                      payment.title
                                    }
                                  </td>

                                  <td className="px-5 py-4 font-bold">
                                    {formatMoney(
                                      payment.amount
                                    )}{" "}
                                    تومان
                                  </td>

                                  <td className="px-5 py-4">
                                    {
                                      payment.method
                                    }
                                  </td>

                                  <td className="px-5 py-4">
                                    {payment.receiptImage ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          showImage(
                                            payment.receiptImage!,
                                            "رسید واریز"
                                          )
                                        }
                                        className="h-12 w-12 overflow-hidden rounded-lg border"
                                      >
                                        <img
                                          src={
                                            payment.receiptImage
                                          }
                                          alt="رسید"
                                          className="h-full w-full object-cover"
                                        />
                                      </button>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
                  گزارشی برای نمایش وجود ندارد.
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ===================================================
          IMAGE MODAL
      =================================================== */}

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          title={selectedImageTitle}
          onClose={closeImage}
        />
      )}
    </main>
  );
}