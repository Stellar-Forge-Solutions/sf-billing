# Stellar Forge Billing (sf-billing)

### Fast billing for small vendors. Print a thermal receipt and send the bill on WhatsApp in about 10 seconds.

**Stellar Forge Billing** is a mobile-first billing web app (installable like an app on your phone) for small shops, stalls and vendors in India. You enter a customer and items, tap **Print**, and a receipt comes out of a cheap **Bluetooth thermal printer**. You can also send a PDF invoice to the customer on **WhatsApp** in one more step.

There is no hardware to buy except a Bluetooth thermal printer, no software to install on a computer, and no training needed. If you can use WhatsApp, you can use this.

> **Who is this README for?**
> Developers, yes, but also **video creators, marketers, sales people and support staff**. Sections 1 to 16 explain the product in plain language so you can make demo videos, reels, posts and training material without reading any code. Technical details are at the end (sections 17 to 19).

---

## Table of contents

1. [The product in 30 seconds](#1-the-product-in-30-seconds)
2. [Who is it for (target audience)](#2-who-is-it-for-target-audience)
3. [The problem and our answer](#3-the-problem-and-our-answer)
4. [The "10-second bill" promise, explained honestly](#4-the-10-second-bill-promise-explained-honestly)
5. [Full feature list](#5-full-feature-list)
6. [Screen-by-screen walkthrough](#6-screen-by-screen-walkthrough)
7. [What a printed receipt looks like](#7-what-a-printed-receipt-looks-like)
8. [WhatsApp billing](#8-whatsapp-billing)
9. [Connecting the thermal printer (one-time setup)](#9-connecting-the-thermal-printer-one-time-setup)
10. [Business use cases and real-life examples](#10-business-use-cases-and-real-life-examples)
11. [Signup, trial and account flow](#11-signup-trial-and-account-flow)
12. [Plans and pricing](#12-plans-and-pricing)
13. [How it compares](#13-how-it-compares)
14. [Honest limits (what it does NOT do)](#14-honest-limits-what-it-does-not-do)
15. [Video and marketing kit](#15-video-and-marketing-kit)
16. [FAQ](#16-faq)
17. [Tech stack and project structure](#17-tech-stack-and-project-structure)
18. [Deploy and configuration](#18-deploy-and-configuration)
19. [Developer notes](#19-developer-notes)

---

## 1. The product in 30 seconds

| | |
|---|---|
| **What it is** | A fast, simple billing and mini-POS web app that works on any phone browser and can be added to the home screen. |
| **Who it is for** | Small vendors and shop owners: kirana, pooja store, medical, tailor, mobile repair, hardware, garage, caterer, home business and more. |
| **Main promise** | Make a bill, print it on a thermal printer and send it on WhatsApp in about **10 seconds**. |
| **Printing** | Any Bluetooth thermal printer, 58 mm (2 inch) or 80 mm (3 inch) paper, through the free Thermer / "Bluetooth Thermal Printer" app. |
| **Sharing** | PDF invoice sent through WhatsApp with a ready-written message. |
| **Payments** | Optional UPI QR printed on the bill with the **exact amount** filled in, so customers scan and pay. |
| **Languages** | The app screens are in English. The printer setup guide is in **English, Hindi and Marathi**. |
| **Free trial** | 15 days, starts when the shop is approved. After that: Basic plan at ₹99 per month or ₹799 per year. |
| **Needs internet?** | Yes. Bills are saved online, so the phone needs a data or Wi-Fi connection. |

**Taglines you can use**

- *Bill in 10 seconds. Print it. WhatsApp it.*
- *Your shop's billing, in your pocket.*
- *No computer. No paperwork. Just tap and print.*
- Hindi: *10 सेकंड में बिल, प्रिंट और WhatsApp!*
- Marathi: *10 सेकंदात बिल, प्रिंट आणि WhatsApp!*

---

## 2. Who is it for (target audience)

### Primary audience

Small vendors who today write bills by hand, or give no bill at all, and want something quick and professional without learning complicated software.

| Persona | Typical day | Why they will like it |
|---|---|---|
| **Kirana / grocery owner** | Many customers, many small items, rush hours. | Repeat a regular customer's last bill in about 4 taps. Quick item suggestions. |
| **Pooja store / general store** | Mixed items, festival rush. | Fast item entry, discount in rupees, round-off. |
| **Medical / stationery / gift shop** | Counter sales all day. | Clean printed receipt with shop name, phone and GST number. |
| **Mobile repair / service shop** | A few bills a day, customers want proof. | Professional bill, WhatsApp PDF so the customer always has a copy. |
| **Tailor / boutique** | Fewer but higher-value bills. | Logo on PDF invoice, backdating for older orders, UPI QR on bill. |
| **Garage / hardware** | Parts plus labour. | Quantity, rate and total are clear; cancel a wrong bill with a reason. |
| **Caterer / tiffin / bakery / home business** | Orders by phone, delivery. | Send the bill on WhatsApp straight to the customer. |
| **Street vendor / market stall** | Standing, one hand free. | Big buttons, thermal printing, no laptop. |

### Secondary audience

- **Shop owners with 2 or 3 helpers** who want to see who billed what and today's sales.
- **First-time digital users** who are comfortable with WhatsApp but not with "software".
- **Resellers, local IT shops and printer sellers** who can offer this to customers along with a thermal printer.

### Who it is not (yet) for

Large supermarkets with barcode scanners, stock control and many billing counters. See [Honest limits](#14-honest-limits-what-it-does-not-do).

### Where these people are

Tier 2, tier 3 and smaller towns, local markets, wholesale lanes, weekly bazaars and housing-society shops. Many prefer Hindi or Marathi. They watch **YouTube Shorts, Instagram Reels and WhatsApp forwards**, so short vertical videos in simple Hindi, Marathi and English work best.

---

## 3. The problem and our answer

| Problem a small vendor faces | How Stellar Forge Billing helps |
|---|---|
| Handwritten bills are slow, messy and sometimes wrong. | Type item, rate and quantity. The app adds everything up. |
| Customers ask "Bill dedo" and the shopkeeper has no time. | Print a receipt in one tap. |
| Customers want a copy on their phone. | Send a PDF bill on WhatsApp in one step. |
| Hard to know how much was sold today. | Dashboard shows today's sales and number of bills. |
| Same customer buys the same things every week. | **Repeat bill** copies the customer and items into a new bill. |
| Wrong bill printed. | **Cancel bill** with a reason. It stays in records, marked cancelled, and is left out of sales totals. |
| Fear of complicated software or a costly POS machine. | Works on the phone they already own. Only a thermal printer is needed. |
| Customers say "I'll pay by UPI, give me your number". | UPI QR with the exact amount is printed on the bill. |
| Phone dies or the browser closes in the middle of a bill. | The unfinished bill is kept on the phone and offered again with **Resume**. |

---

## 4. The "10-second bill" promise, explained honestly

"Under 10 seconds" is our target for a **typical small counter sale** (a returning customer, or a new customer with 1 to 3 items) by someone who has used the app a few times. It is not a stopwatch guarantee for every bill. A bill with 15 items will take longer, because every item has to be typed.

Here is how the time is actually spent.

### Fastest path: repeat a regular customer (about 4 taps)

The app's own sign-in screen describes this path as **"Bill a regular in 4 taps"**:

1. **Open** the customer's last bill on the Dashboard.
2. Tap **Repeat bill**. The same customer and items are loaded into a new bill dated today.
3. Tap **Print Bill**.
4. Tap **Print now** if the app asks for one more confirmation.

Remember to change quantities if needed; you can tap **+** and **−** on any line.

### New customer, 1 to 3 items

| Moment | What you do | Rough time |
|---|---|---|
| 1 | Type the customer name (or tap a **recent customer** chip) and tap **Start Billing**. | 2 to 3 sec |
| 2 | Type the item name. Tap a suggestion if it shows. Type the **price**, type the **qty**, press add. | 2 to 3 sec per item |
| 3 | Optional: enter a **discount** in rupees, tick **Round off**. | 1 to 2 sec |
| 4 | Tap **Print Bill**. The bill is saved and the printer app opens. | 1 to 2 sec |
| 5 | Optional: open the bill and tap **WhatsApp**, enter the number, send. | 4 to 6 sec |

**For video creators:** do not fake the speed. Film a real stopwatch on screen, show a repeat bill (the fastest case) and a one-item new bill, and say "under 10 seconds for a normal bill". The honest version is more convincing.

### Speed helpers built into the app

- Cursor jumps to the next field after you pick an item name.
- A **"Last price"** hint shows the price you used for that item last time. It is shown as a hint, never filled in by itself, so you cannot bill a wrong price by accident.
- Item names you type on a printed bill are **added to your item list automatically**, so the suggestion appears next time.
- **Recent customer** chips under the name box.
- The same item with the same price added twice is **merged into one line**.
- **Round-off** choice is remembered on that phone.
- **Reprint last bill** button on the New Bill screen if the printer jammed.

---

## 5. Full feature list

### 5.1 Billing (the core)

- **Customer name** at the start of each bill, with recent and matching customer suggestions.
- **Billing date**: defaults to today, and you can **backdate** a bill (future dates are not allowed).
- **Items with price and quantity** per line, with **+ / −** buttons and typed quantity.
- **Item name suggestions** from your saved item list and from your bill history.
- **Last-used price hint** per item.
- **Edit a line** (price and quantity) after adding it.
- **Remove a line with Undo**, in case of a wrong tap.
- **Discount in rupees**, which can never be more than the bill amount.
- **Round off to the nearest rupee** (optional). The round-off amount is shown on the bill.
- **Live totals**: subtotal, discount, round-off and final total.
- **Save as Draft** to finish later, from the Dashboard Drafts tab.
- **Reopen and edit a draft**, or delete it.
- **Repeat bill**: new bill with the same customer and items, dated today.
- **Automatic unfinished-bill recovery**: if the phone dies, the page refreshes or you press Back, the bill in progress is kept and offered as **Resume** (or Discard).
- **Back-button protection**: asks before discarding a bill that has items.
- **Reprint last bill** from the start screen.
- **Per-shop bill numbers** in the format `PREFIX-000123`. Each shop has its own series and can choose its own prefix.

### 5.2 Thermal receipt printing

- Prints on **any Bluetooth thermal printer** through the free **Thermer / Bluetooth Thermal Printer** app.
- **58 mm and 80 mm** paper. The receipt layout adjusts (32 characters wide for 58 mm, 48 for 80 mm).
- Receipt shows: shop name, tagline, address, phone, GSTIN, bill number, date and time, customer, staff name, items with quantity, rate and amount, subtotal, discount, round-off, **big TOTAL**, optional **UPI QR**, thank-you text, website.
- **Cancelled bills** print with a "CANCELLED" mark if reprinted.
- **Secure print links**: the printer app gets a short-lived signed link that expires in 5 minutes, so nobody else can read your bills by guessing a URL.
- **Printed bills are frozen**: each printed bill keeps a snapshot of your shop details at the time of printing. Editing your shop name or address later does not change old bills.
- A built-in **Connect Printer** guide (button on the home page) in **English, Hindi and Marathi**.

### 5.3 WhatsApp billing

- Tap **WhatsApp** on any bill, enter the customer's 10-digit number (91 is added automatically).
- The app creates a **PDF invoice** and uploads it, then opens WhatsApp with a ready message containing the shop name, customer name, bill number, date, total and the invoice link.
- The PDF is a clean **A4 invoice** with your **logo**, shop details, items, totals, staff name and optional UPI QR.

### 5.4 UPI payment QR

- Add your **UPI ID** in Settings and switch on **Show payment QR on bills**.
- The QR on a printed bill contains the **exact bill amount** and the bill number as the payment note.
- Settings shows a live preview (with Rs. 1.00) so you can check it before using it.

### 5.5 Items catalog

- **Items page** to add, search, rename and delete item names. Names only. Price is entered on each bill because prices change often.
- New names typed on printed bills are added automatically.

### 5.6 Dashboard, history and reports

- **Today's sales** and **number of printed bills** on the home screen and dashboard.
- **Date filters**: Today, Yesterday, 7 days, 30 days, All time, or **pick any date**.
- **Status tabs**: All, Drafts, Printed, Cancelled.
- **Search** by customer name or bill number (for example "SF-000123" or just "123").
- **Customer view**: tap a customer name to see all their bills and their total.
- **Sales by staff** (owner view).
- **Bill details** popup with every item, totals and status.
- **Cancel a printed bill** with a written reason. It stays in your records, is marked cancelled, and is excluded from sales totals.
- **Export to Excel / Google Sheets (CSV)**: all bills, and an **items sold** report (quantity and amount per item, highest first).
- Old drafts are highlighted so nothing is forgotten.

### 5.7 Shop settings

- Shop name, second line (tagline), address, mobile, WhatsApp number.
- **Logo upload** (shown on PDF and WhatsApp bills).
- **GST number** (printed on receipts), website, UPI ID.
- **Bill number prefix** (1 to 6 letters or digits).
- **Thank-you text**.
- **Paper width**: 58 mm or 80 mm.
- Changes apply to **new** bills. Printed bills never change.

### 5.8 Accounts and access

- **Self-signup** with a 15-day free trial, started after approval.
- **Sign in** and **forgot password** by email.
- **Owner and staff roles** (see below).
- **Trial and view-only mode**: after the trial or when an account is on hold, the shop can still **view** its bills, but printing, sharing, exports and new bills are switched off until the plan continues.

### 5.9 Works like an app

- **Add to Home Screen** (PWA): opens full screen with the Stellar Forge icon, no browser bar.
- Mobile-first layout, large touch buttons, safe-area support for notched phones.
- Light, clean look with a dark billing screen to keep focus on the bill.

### 5.10 Owner vs staff

- On the basic plan there is **one user per shop**, and that user sees everything, including sales totals.
- On the Pro plan, an owner email list is set up so that **staff cannot see your sales totals**: today's sales on Home, sales totals and bill amounts on the Dashboard, customer totals, sales by staff and Excel exports are hidden, and only the owner can cancel printed bills. Staff can still create, print and share bills. Each bill records **who created it**. See [Plans and pricing](#12-plans-and-pricing) for the full table.

---

## 6. Screen-by-screen walkthrough

Use this as your shot list. Each screen says what is on it and what to show.

### 6.1 Sign-in screen
- Dark screen with the Stellar Forge mark.
- A rotating showcase of benefits: **"Bill a regular in 4 taps"**, **"Your shop name on every bill"**, **"UPI QR with the exact amount"**, **"Any Bluetooth thermal printer"**, **"Send bills on WhatsApp"**, **"Sales that fill themselves"**.
- Fields: email, password, **Forgot password?**, **Sign In**.
- Link to **create an account**.
- *Show:* the animated benefit slides in the first 5 seconds of any promo video.

### 6.2 Signup screen
- Title: **"Start your 15-day free trial"**.
- Fields: shop name, owner name, mobile, WhatsApp number (tick "same" to skip), email, password (8+ characters), city, type of business, optional Google Maps / Instagram / website link.
- Message: every new shop is reviewed within 1 hour (9 am to 9 pm IST) and the owner is messaged on WhatsApp.

### 6.3 Waiting for approval screen
- "Thanks, <shop name>! Your account is under review."
- Shows the expected review time and the WhatsApp number, with a **Check status** button.

### 6.4 Home screen
- Shop name large at the top, "Billing System" label, a welcome line.
- **Today's sales** card (dark) with the amount and the count of printed bills.
- Three quick stats: **Items**, **Bills**, **Drafts**.
- Buttons: **Start New Bill**, **Billing Dashboard**, **Manage Items**, **Connect Printer**.
- A **How it works** row: Add Items, Build Bill, Save Draft, Print.
- *Show:* tap **Start New Bill** as the first action in every tutorial.

### 6.5 New Bill: start step
- Dark full screen with a big receipt icon.
- **Customer Name** box with **Recent customers** chips.
- **Billing Date** (defaults to today).
- **Start Billing**.
- If there is an unfinished bill: a green **Resume** card.
- **Reprint last bill** button showing the number, customer and amount.

### 6.6 New Bill: item entry step
- Item name box with suggestions, **price** box with a "last price" hint, **qty** box with **+ / −**.
- The bill list below, each line with **+ / −**, edit, and ✕ remove (with **Undo** bar).
- Discount box, **Round off to nearest ₹** checkbox.
- Totals area.
- Buttons: **Save Draft** and **Print Bill**.
- *Show:* add 2 items, a discount and tap **Print Bill**. This is the hero shot.

### 6.7 Print moment
- After **Print Bill**, the phone asks to open the printer app (first time only, it may ask permission).
- The receipt prints within a second or two.
- If the screen needs another tap, a **Print now** prompt appears. This is a browser safety rule: pages can only open another app right after a tap.

### 6.8 Dashboard
- Top stats: sales (owner), printed bills, drafts.
- Filters: Today, Yesterday, 7 days, 30 days, All time, date picker.
- Tabs: All, Drafts, Printed, Cancelled.
- Search box and **export** buttons (Bills for Excel, Items sold).
- Bill list. Tap a bill to open details with **Print**, **WhatsApp**, **Repeat bill**, **Cancel bill** (owner), **Edit / Delete** (drafts).

### 6.9 WhatsApp popup
- Enter the customer's number, tap **Send on WhatsApp**.
- Shows "Generating PDF and uploading", then opens WhatsApp with the message ready.

### 6.10 Items page
- Add item, search, rename, delete.

### 6.11 Settings page
- Shop details, logo, tax and payment (GST, website, UPI, QR switch with preview), bill and printer (prefix, thank-you text, paper width), **Save settings**.

### 6.12 Connect Printer page
- Language buttons: **English / हिन्दी / मराठी**.
- Checklist, then 3 steps: install the app (Play Store and App Store buttons), create a bill and tap Print, turn on Bluetooth and select the printer (one time).
- Troubleshooting list.

---

## 7. What a printed receipt looks like

This is a real layout sample for **58 mm** paper (32 characters wide). 80 mm paper uses the same layout, just wider.

```
      SHREE GANESH KIRANA       
       Fresh. Fast. Fair.       
     Shivaji Chowk, Pimpri      
         Ph: 98XXXXXXXX         
     GSTIN: 27XXXXXXXXXXXXX     
================================
Bill: SF-000042
Date: 11 Oct 2026 06:42 pm
Cust: Ravi Kumar
By  : shop
================================
# Item       Qty   Rate     Amt
--------------------------------
1 Rice 5kg     1 320.00  320.00
2 Sugar        2  48.00   96.00
3 Tea 250g     1 120.00  120.00
4 Atta 10kg    1 410.00  410.00
================================
             Subtotal: Rs.946.00
             Discount: -Rs.46.00
================================
        TOTAL Rs.900.00         
================================
     Scan to pay Rs.900.00      
        [ UPI QR CODE ]         

     Thank you! Visit again     
    Billing by Stellar Forge    
```

Sample data only. Use fake shop details in public videos, not a real customer's phone number.

---

## 8. WhatsApp billing

**What the customer receives (example):**

```
🧾 *Shree Ganesh Kirana*

Dear *Ravi Kumar*,

Your bill SF-000042 dated 11/10/2026
💰 Total: *Rs. 900.00*

Download your invoice:
<link to the PDF invoice>

Thank you! Visit again 🙏
_Shree Ganesh Kirana Fresh. Fast. Fair._
_Billing by Stellar Forge_
```

**Good to know**

- The message is **pre-filled** in the vendor's own WhatsApp. The vendor taps WhatsApp's send button, so the message goes from the shop's own number.
- The customer gets a **link to a PDF invoice**. The link is not an attached file.
- The invoice is a neat A4 PDF with the shop logo, items, totals, staff name and the UPI QR if enabled.
- Works for any number. If you enter 10 digits, +91 is added.

---

## 9. Connecting the thermal printer (one-time setup)

In the app, tap **Connect Printer** on the Home screen. The same steps in short:

1. **Install the free printing app** on the phone.
   - Android: Play Store, "Bluetooth Thermal Printer" (Thermer).
   - iPhone: App Store, "Bluetooth Thermal Printer".
   - Open the app once and allow the permissions it asks for.
2. **Create any bill and tap Print.** The phone asks whether to open the printer app. Tap **Open / Allow**.
3. **Turn on Bluetooth and choose the printer.** The first time only, allow Bluetooth (and Nearby devices or Location on Android), pick the printer from the list, and enter the pairing code if asked (often `0000` or `1234`; see the printer manual).

After that, every bill prints with one tap.

**Printer tips for support and videos**

- Keep the printer ON, with paper loaded, near the phone.
- Match **Settings > Printer paper** (58 mm or 80 mm) to the paper roll.
- If printing stops, close the printer app fully and tap Print again, or use **Reprint last bill**.
- Official printing app site: https://www.thermerapp.com/
- Android: https://play.google.com/store/apps/details?id=mate.bluetoothprint
- iPhone: https://apps.apple.com/id/app/bluetooth-thermal-printer/id1599863946

---

## 10. Business use cases and real-life examples

### Example A: Kirana store, evening rush
Customer comes every Saturday for the same groceries. The shopkeeper opens last Saturday's bill, taps **Repeat bill**, changes sugar from 2 to 3, taps **Print Bill**. Receipt is printed while the customer is still talking. No re-typing.

### Example B: Mobile repair shop
Customer leaves a phone for screen replacement. Bill has "Screen replacement" and "Labour". The owner taps **WhatsApp**, enters the customer's number, and the PDF invoice lands in the customer's chat. The customer has proof of payment and warranty details.

### Example C: Pooja store before a festival
Dozens of small items per customer. Item suggestions and the "last price" hint cut typing. At the end of the day the owner opens **Dashboard > Today** to see total sales and exports **Items sold** to learn which items moved the most before reordering stock.

### Example D: Tailor with older orders
A customer picks up clothes ordered last week and wants a bill dated the order day. The owner **backdates** the bill on the start screen.

### Example E: Home bakery
Orders come on WhatsApp. The baker bills the customer name, adds items, and sends the PDF invoice back on WhatsApp with the UPI QR so the customer can pay straight away.

### Example F: Shop with two helpers
Each helper bills from their own login (Pro plan). The helpers cannot see the shop's earnings. The owner opens the dashboard and sees the totals, **sales by staff** and which helper created which bill.

### Business benefits to mention in videos

- **Looks professional**: shop name, address, GST number, logo, QR on every bill.
- **Saves time at the counter**: fewer mistakes, no re-adding numbers by hand.
- **Fewer disputes**: customers have a proper bill, and cancelled bills keep a reason.
- **Faster payment**: UPI QR with the exact amount.
- **Know your numbers**: daily sales, items sold, staff sales, and Excel export for the accountant.
- **Low cost to start**: the phone you own plus a thermal printer.
- **GST-ready display**: your GSTIN prints on every receipt (see limits for tax calculations).

---

## 11. Signup, trial and account flow

```
Create account  ->  Under review (about 1 working hour)  ->  Approved on WhatsApp
      ->  15-day free trial starts  ->  Use everything
      ->  Plan continues, or view-only mode after the trial
```

1. **Sign up** at `/signup` with shop details.
2. The shop goes to **review**. The Stellar Forge team checks within **1 hour, 9 am to 9 pm IST**, and sends a WhatsApp message.
3. On approval, the **15-day free trial** starts.
4. In the **last 5 days** of the trial, an orange banner shows the days left.
5. When the trial ends or the account is put on hold, the shop is in **view-only** mode: bills can be viewed, but new bills, printing, sharing and exports are off. The **Upgrade to Basic plan** button (see [Plans and pricing](#12-plans-and-pricing)) is shown in the banner, on Settings and on Home.
6. Other states shown to users: **Account not approved** (with a note) and **Account on hold**.

Spam protection on signup: disposable email domains are blocked, Gmail aliases are treated as one address, and a hidden trap field catches bots.

---

## 12. Plans and pricing

| | **Free trial** | **Basic plan** | **Pro plan** |
|---|---|---|---|
| **Price** | Free for 15 days (starts when the shop is approved) | **₹99 per month**, or **₹799 per year** (about a third cheaper) | **₹199 per month**, or **₹1,599 per year** |
| **Best for** | Trying the app | Owner billing alone | Shops with helpers at the counter |
| **Users** | 1 | 1 | Owner plus staff logins |
| **Bills** | Unlimited | Unlimited | Unlimited |
| **Bluetooth thermal printing (58 / 80 mm)** | Yes | Yes | Yes |
| **WhatsApp PDF bills and UPI QR** | Yes | Yes | Yes |
| **Dashboard, reports and Excel export** | Yes | Yes | Yes |
| **Owner and staff roles** (staff cannot see your sales totals, earnings or reports) | No | No | Yes |
| **Sales by staff, and who created each bill** | No | No | Yes |
| **Support** | Standard | Standard | Priority WhatsApp support |
| **After it ends** | View-only mode | Continues while the plan is active | Continues while the plan is active |

**Why shops choose Pro: your helpers can bill, but they cannot see your earnings**

Many owners hesitate to let a helper use the billing phone because the dashboard shows how much the shop earns. With Pro, you keep control:

| What | Owner | Staff |
|---|---|---|
| Create bills, save drafts, print, repeat bills | Yes | Yes |
| Send bills on WhatsApp | Yes | Yes |
| **Today's sales amount on the Home screen** | Yes | **Hidden** |
| **Sales total on the Dashboard** (today, 7 days, 30 days, all time) | Yes | **Hidden** |
| **Bill amounts in the Dashboard list** | Yes | **Hidden** |
| **Customer-wise total amount** | Yes | **Hidden** |
| **Sales by staff** (who sold how much) | Yes | **Hidden** |
| **Excel exports** (Bills and Items sold) | Yes | **Hidden** |
| **Cancel a printed bill** | Yes | **Hidden** |
| **Clear old drafts in bulk** | Yes | **Hidden** |
| Every bill records who created it | Yes | Yes |

What staff can still see: the amount of the bill they are making, the printed receipt, and the details of a single bill they open. They cannot see your day's earnings, your totals or your reports. If you need even single-bill amounts hidden from staff, tell us.

**How Pro is set up:** Pro is activated by the Stellar Forge team on request. After you pay, the team adds the staff logins and the owner and staff settings for your shop, so please message us on WhatsApp first (the **Ask about Pro plan** button in the app does this). Basic stays at one user per shop.

**Where plans show in the app**

- **Settings page, at the very top:** a plan card with the plan status (trial days left, Basic active, or trial ended), the Basic price and features, an **Upgrade to Basic plan** button, and below it the Pro price and features with an **Ask about Pro plan** button.
- **Home page:** a smaller plan card above the action buttons with the Basic price, the upgrade button and a one-line Pro summary with its button.
- **Trial banner:** the orange banner (last 5 days of the trial) and the red view-only banner both include an **Upgrade to Basic plan** link.

**How upgrading works today**

1. The shop owner taps **Upgrade to Basic plan**.
2. WhatsApp opens a chat with **+91 92702 43271** and a ready message asking for the monthly Basic subscription. The message already includes the shop name, mobile number and login email.
3. The Stellar Forge team shares the payment details (for example a UPI payment).
4. After payment, the team sets the shop's `paid_until` date in the admin dashboard and the shop continues without any other change.
5. Once the plan is active, the card shows **Basic plan active** with the end date, and the button changes to **Renew plan on WhatsApp**.

**Change prices or the WhatsApp number:** edit `src/lib/plans.js` only (`BASIC_PLAN`, `PRO_PLAN`, `UPGRADE_WHATSAPP`). The in-app cards update automatically. Remember to update this table and any videos or posts too.

---

## 13. How it compares

| | Handwritten bill | Big POS machine / desktop software | **Stellar Forge Billing** |
|---|---|---|---|
| Cost to start | Pen and book | High (machine, software, setup) | **Phone + thermal printer** |
| Learning time | None | Days of training | **Minutes** |
| Speed per bill | Slow | Fast once trained | **About 10 seconds for a normal bill** |
| Looks professional | Depends | Yes | **Yes, with logo, GST and QR** |
| WhatsApp bill | No | Often extra | **Built in** |
| Daily sales view | Manual totals | Yes | **Yes, instantly** |
| Works on a phone | Yes | Usually no | **Yes, mobile-first** |
| Stock and barcode | No | Yes | **Not yet** |

---

## 14. Honest limits (what it does NOT do)

Be clear about these in videos and sales calls so nobody feels misled.

- **Internet is required.** Bills are saved online. An unfinished bill is kept on the phone if the connection drops, but saving and printing need the internet.
- **No stock or inventory tracking.** The Items list holds names only. There is no stock count and no low-stock alert.
- **No barcode scanning.** Items are typed or picked from suggestions.
- **No automatic GST calculation or tax invoices with CGST/SGST split.** Your GSTIN prints on the receipt, and the total is what you enter. If you need tax breakup bills, tell your accountant.
- **Prices are entered on every bill.** This is deliberate, because prices change often. A "last price" hint helps.
- **One user per shop on the Basic plan.** Multiple staff logins and hiding money from staff belong to the Pro plan.
- **Customer name only.** No customer database with phone and address, no pending-payment or credit (udhaar) ledger.
- **Rupees only.** Built for India (INR, IST, +91 numbers).
- **WhatsApp sends a link.** The invoice is a PDF link in the message, not an attached file, and the vendor taps send in WhatsApp.
- **Thermal printing uses a separate free app.** The printer app must be installed once.
- **Search and history window.** Bills from the last 35 days are loaded at first; older ones load when you choose a longer range.

---

## 15. Video and marketing kit

### 14.1 Key messages (pick 2 or 3 per video)

1. **Speed:** a normal bill in about 10 seconds.
2. **Professional:** shop name, logo, GST number and UPI QR on every bill.
3. **WhatsApp:** the customer gets the bill on their phone.
4. **Simple:** works on the phone you already have, no computer.
5. **Control:** today's sales, items sold, who billed what, Excel export.
6. **Safe:** wrong bill? Cancel it with a reason. Phone died? Resume it.

### 14.2 Suggested videos

| # | Video | Length | Audience | Goal |
|---|---|---|---|---|
| 1 | **"Bill in 10 seconds" reel** | 20 to 30 sec | New vendors | Grab attention, show speed |
| 2 | **Full feature tour** | 3 to 4 min | Interested shop owners | Show everything in order |
| 3 | **Printer setup in Hindi** | 1 to 2 min | New users | Reduce support calls |
| 4 | **Printer setup in Marathi** | 1 to 2 min | New users | Same, for Maharashtra |
| 5 | **WhatsApp billing demo** | 30 to 45 sec | Service shops | Show sharing |
| 6 | **Regular customer in 4 taps** | 20 sec | Kirana owners | Show Repeat bill |
| 7 | **Dashboard and Excel export** | 1 to 2 min | Owners with helpers | Show control and reports |
| 8 | **Signup and trial walkthrough** | 1 min | Everyone | Remove fear of signing up |
| 9 | **Before and after (handwritten vs app)** | 30 sec | Social media | Emotional comparison |
| 10 | **FAQ short answers** | 15 sec each | Everyone | Answer top questions |

### 14.3 Sample script: 30-second "Bill in 10 seconds" reel

| Time | Visual | Voiceover (English) |
|---|---|---|
| 0:00 to 0:03 | Busy counter, customer waiting, handwritten bill. | "Customer waiting? Bill taking forever?" |
| 0:03 to 0:07 | Phone opens the app, tap **Start New Bill**. | "Open Stellar Forge Billing." |
| 0:07 to 0:14 | Type name, add 2 items quickly. Stopwatch on screen. | "Add the customer, add the items." |
| 0:14 to 0:19 | Tap **Print Bill**. Receipt comes out of the printer. | "Tap print. Receipt ready." |
| 0:19 to 0:25 | Open the bill, tap **WhatsApp**, message appears. | "Send the bill on WhatsApp too." |
| 0:25 to 0:30 | Logo, **"Try free for 15 days"**. | "Stellar Forge Billing. Start your free trial." |

**Hindi voiceover (same timing):** "ग्राहक इंतज़ार कर रहा है? बिल बनाने में देर? Stellar Forge Billing खोलिए, ग्राहक और आइटम डालिए, Print दबाइए, रसीद तैयार! WhatsApp पर भी बिल भेजिए। 15 दिन मुफ़्त आज़माइए।"

**Marathi voiceover (same timing):** "ग्राहक थांबलाय? बिल बनवायला उशीर? Stellar Forge Billing उघडा, ग्राहक आणि आयटम टाका, Print दाबा, पावती तयार! WhatsApp वरही बिल पाठवा. 15 दिवस मोफत वापरून पहा."

### 14.4 Sample outline: 3-minute feature tour

1. **Hook (0:00)**: "Make a bill, print it and WhatsApp it in about 10 seconds."
2. **Sign in and home screen (0:15)**: show today's sales and quick stats.
3. **Settings (0:35)**: add shop name, logo, GST number, UPI ID, switch on QR, choose 58 mm paper.
4. **First bill (1:00)**: Start New Bill, customer chips, items with suggestions, last price hint, discount, round off.
5. **Print (1:40)**: tap **Print Bill**, show the receipt and the QR.
6. **WhatsApp (2:00)**: open the bill, send the PDF.
7. **Repeat bill (2:20)**: the 4-tap flow for a regular customer.
8. **Dashboard (2:35)**: filters, search, cancel a bill, export Excel.
9. **Call to action (2:55)**: "Start your free 15-day trial."

### 14.5 Shot list and filming tips

- Film **vertical (9:16)** for Shorts, Reels and Status. Use 16:9 only for long tutorials.
- Use **screen recording** for app screens and a **second phone or camera** for the printer printing.
- Show the **real receipt in hand** at the end. It is the most convincing shot.
- Show **hands, not faces**, if the vendor does not want to appear on camera.
- Use **fake customers and phone numbers** in public videos.
- Show a **stopwatch** only for fast cases (repeat bill, 1 to 3 items).
- Add **subtitles** (English, Hindi, Marathi). Many viewers watch without sound.
- Put the app name and the "15-day free trial" line on screen at the end.
- Record in good light, and keep the phone still for the printer shots.

### 14.6 On-screen text ideas (short)

- "Bill in 10 sec"
- "Print on any Bluetooth printer"
- "UPI QR with the exact amount"
- "WhatsApp the bill"
- "Repeat bill in 4 taps"
- "Your logo. Your GST. Your bill."
- "Cancel with a reason"
- "Excel report in one tap"
- "15-day free trial"

### 14.7 Brand and style

- **Name:** Stellar Forge Billing (short: SF Billing). Footer line on bills: "Billing by Stellar Forge".
- **Colors:** ink / dark navy `#0f1923`, teal `#00c9a7`, deep teal `#00a88c`, paper `#f7f8fa`.
- **Fonts:** clean sans-serif UI, JetBrains Mono for money amounts.
- **Logo:** `public/sf-mark-light.png`. App icons: `public/icon-192.png`, `public/icon-512.png`.
- **Tone:** simple, friendly, practical. Talk like a helpful neighbour, not a software company. Avoid technical words like "SaaS", "cloud", "API" in vendor-facing videos.

### 14.8 Hashtag and caption ideas

`#SmallBusinessIndia #KiranaStore #DigitalIndia #BillingApp #ThermalPrinter #WhatsAppBilling #UPI #Vyapar #ShopOwner #LocalBusiness #MadeForIndia`

Caption starter: *"Bill banao, print karo, WhatsApp karo. Sirf 10 second mein. 15 din free try karein."*

### 14.9 Call to action

- "Start your **15-day free trial**."
- "Sign up, we review within 1 hour, and you start billing."
- Support contact: workwithstellarforge@gmail.com

---

## 16. FAQ

**Do I need a computer?** No. A phone is enough.

**Which printer should I buy?** Any Bluetooth thermal receipt printer that works with the Thermer / Bluetooth Thermal Printer app, in 58 mm or 80 mm. Check the paper size and set the same size in Settings.

**Does it work on iPhone?** The web app works in the iPhone browser and can be added to the Home Screen. For printing, install the "Bluetooth Thermal Printer" iPhone app, linked from the in-app **Connect Printer** page.

**Does it work without internet?** No. You need data or Wi-Fi to save and print bills.

**Can I send the bill on WhatsApp?** Yes. Open the bill, tap **WhatsApp**, enter the customer's number and send.

**Can customers pay by UPI from the bill?** Yes, if you add your UPI ID and switch on the QR in Settings. The QR carries the exact bill amount.

**Can I change a bill after printing?** No. Printed bills are final. You can **cancel** a printed bill with a reason and make a new one. Drafts can be edited freely.

**Will changing my shop name change old bills?** No. Printed bills keep the shop details they were printed with.

**What if my phone dies in the middle of a bill?** Open New Bill again. The unfinished bill appears with a **Resume** button.

**Can I make a bill for an earlier date?** Yes. Pick a past date on the start screen.

**Can I get my data in Excel?** Yes. In the Dashboard, export **Bills** or **Items sold**. The files open directly in Excel or Google Sheets.

**Can my staff use it?** Basic plan: one user per shop. Pro plan (₹199 per month or ₹1,599 per year): staff logins who can bill and print but cannot see your sales totals, earnings, reports or exports, and sales by staff for you. Message us on WhatsApp to set it up.

**What happens after the free trial?** The shop becomes view-only until the plan continues. Existing bills remain visible. Tap **Upgrade to Basic plan** (Settings or Home) to message us on WhatsApp. The Basic plan is ₹99 per month or ₹799 per year.

**How do I pay?** The upgrade button opens WhatsApp with a ready message. We share the payment details, and activate your plan after payment.

**Is GST calculated automatically?** No. Your GSTIN prints on the receipt, but tax is not calculated or split. See limits.

**Which languages are supported?** The app screens are English. The printer setup guide is English, Hindi and Marathi.

**My printer is not printing.** Check: printer ON, paper loaded, phone Bluetooth ON, printer app installed and opened once, correct paper size in Settings. Close the printer app and tap Print again, or use **Reprint last bill**.

---

## 17. Tech stack and project structure

**Stack:** React 18, Vite 5, React Router 6, Supabase (database, authentication, file storage), jsPDF (PDF invoices), qrcode (UPI QR), Vercel (hosting and serverless API), Gmail API (admin alert emails).

```
sf-billing/
  api/                      Vercel serverless functions
    print-token.js          Gives a signed 5-minute token for one of the shop's own bills
    print-bill.js           Returns the receipt JSON that the Thermer app prints
    signup.js               Self-signup, spam checks, creates user + pending shop, alerts admins
    _lib/gmail.js           Sends admin emails through the Gmail API
  public/                   PWA manifest, service worker, icons, logo
  src/
    App.jsx                 Routes, top navigation, access guards
    pages/
      LoginPage.jsx         Sign in and password reset
      SignupPage.jsx        Free trial signup
      HomePage.jsx          Home, stats, quick actions
      BillPage.jsx          New bill, drafts, repeat bill
      DashboardPage.jsx     History, filters, details, WhatsApp, export
      ItemsPage.jsx         Item names catalog
      SettingsPage.jsx      Shop profile, UPI, paper width
      ConnectPrinterPage.jsx  3-step printer guide in English, Hindi, Marathi
    components/             ShopGate (approval/trial gate), Toast, LoginShowcase, PlanCard (plan + upgrade button)
    lib/                    supabase client, auth and shop context, print, bill helpers, roles, plans (prices + upgrade WhatsApp link)
  index.html, vite.config.js, vercel.json, package.json, .env.example
```

**Routes**

| Path | Page | Needs sign-in |
|---|---|---|
| `/login` | Sign in | No |
| `/signup` | Free trial signup | No |
| `/` | Home | Yes |
| `/bill`, `/bill/:id` | New bill, edit a draft (`?copy=<id>` repeats a bill) | Yes |
| `/dashboard` | Dashboard | Yes |
| `/items` | Items | Yes |
| `/settings` | Shop settings | Yes |
| `/connect-printer` | Printer setup guide | Yes |

**Main database tables used:** `shops`, `bills`, `bill_items`, `items`, plus a shop entitlements record that controls trial, paid and view-only state. Row access is per shop. The database migrations live in the **sf-admin-dash** repo.

---

## 18. Deploy and configuration

1. Deploy the **sf-admin-dash** repo first: it owns the database migrations (0001, 0002) and the DB workflow.
2. Push this folder to its own GitHub repo, then in Vercel: Add New Project, import it (Vite). Add the environment variables below.
3. In Supabase, go to Authentication, Providers, Email and turn **OFF** "Allow new users to sign up" (signup goes through `/api/signup`). Set the Site URL to your Vercel URL.
4. Password-reset emails use Supabase's built-in mail until you set a custom SMTP in Supabase.
5. Printing: keep using the Thermer app. **Settings > Paper width** (58 or 80 mm) controls the receipt layout.

**Environment variables** (see `.env.example`)

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser (public) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser (public) | Supabase public key |
| `VITE_OWNER_EMAILS` | Browser (optional) | Comma-separated owner emails for the Pro staff/owner split. Empty means everyone sees everything |
| `SUPABASE_URL` | Server only | Supabase URL for the API functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service key. **Never** prefix with `VITE_` |
| `PRINT_SIGNING_SECRET` | Server only | Long random string used to sign print links |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Server only | Gmail API for admin alert emails |
| `GMAIL_SENDER` | Server only | Sender address for admin alerts |
| `ADMIN_EMAILS` | Server only | Who is alerted about new signups |
| `ADMIN_DASH_URL` | Server only | Link to the admin dashboard |

**Run locally**

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build
npm run preview   # preview the build
```

The `/api` functions run on Vercel. For local testing of printing and signup, use `vercel dev`.

---

## 19. Developer notes

- **Printing flow:** the browser calls `/api/print-token` with the user's login, receives a 5-minute signed token, then opens `my.bluetoothprint.scheme://<origin>/api/print-bill?id=...&t=...`. The printer app fetches the receipt JSON from `/api/print-bill`, which checks the token and that the shop is allowed to write.
- **Receipt width:** 58 mm uses 32 characters, 80 mm uses 48 characters. The UPI QR size also changes with paper width.
- **Bill snapshots:** when a bill is printed, a snapshot of the shop profile is stored on it. Receipts and PDFs read the snapshot first, so profile edits never rewrite history.
- **Round-off** is not stored. It is derived as the sub-rupee difference between the items total (less discount) and the saved total.
- **Bill numbers** are per shop: prefix plus a 6-digit number, for example `SF-000042`. Drafts show as "Draft" until printed.
- **Dates** use India time (IST) for "today" and for billing dates.
- **Offline behaviour:** the service worker is network-first and caches successful GET responses. It does not cache Supabase calls, so saving still needs internet.
- **Storage keys on the phone:** in-progress bills (so Resume works), round-off preference, and printer-guide language (`sf_printer_lang`).
- **Write guard:** `guardWrite()` blocks printing, sharing and exports in view-only mode, and the print API re-checks this on the server.
- **CSV exports** are protected against spreadsheet formula injection.
- **Plans:** `src/lib/plans.js` holds the Basic plan price, features, the upgrade WhatsApp number and `planState()` (paid, trial or ended, from the `entitlements` row). `PlanCard` is used on Settings and Home, and `ShopGate` shows the upgrade link in its banner.
- **Printer guide languages:** to add another language, add a new entry to the `T` object and the `LANGS` list in `src/pages/ConnectPrinterPage.jsx`.

---

*Powered by Stellar Forge.*
