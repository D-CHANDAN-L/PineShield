import os
import sys
import json
import re
import openpyxl
import docx

sys.stdout.reconfigure(encoding='utf-8')

FILE_ERRORS = r"C:\Users\Dkesh\Downloads\Errors_Issue_and_their_resolution_steps.xlsx"
FILE_SOP = r"C:\Users\Dkesh\Downloads\Key_RT_Pain_Points___SOP.xlsx"
FILE_DOCX = r"C:\Users\Dkesh\Downloads\POS Guide.docx"

chunks = []

def clean_text(val):
    if val is None:
        return ""
    text = str(val).strip()
    text = re.sub(r'\s+', ' ', text)
    return text

def tokenize(text):
    tokens = re.findall(r'[a-zA-Z0-9#_.-]+', (text or "").lower())
    stop_words = {'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'this', 'that', 'from', 'as', 'are', 'was', 'be'}
    return [t for t in tokens if t not in stop_words and len(t) > 1]

# ==============================================================================
# 1. PARSE Errors_Issue_and_their_resolution_steps.xlsx
# ==============================================================================
print(f"Loading {FILE_ERRORS}...")
wb_err = openpyxl.load_workbook(FILE_ERRORS, data_only=True)

# 1.1 Plutus EDC Issue_Errors
ws_edc = wb_err['Plutus EDC Issue_Errors']
print(f"  Parsing Plutus EDC Issue_Errors ({ws_edc.max_row} rows)...")
for r in range(2, ws_edc.max_row + 1):
    sno = ws_edc.cell(row=r, column=1).value
    issue = clean_text(ws_edc.cell(row=r, column=2).value)
    reason = clean_text(ws_edc.cell(row=r, column=3).value)
    solution = clean_text(ws_edc.cell(row=r, column=4).value)
    
    if not issue and not reason and not solution:
        continue
    
    chunk_id = f"edc_err_{r}"
    title = issue if issue else f"EDC Issue #{sno}"
    content = f"### POS Error / Issue: {title}\n- **Reason of Occurrence:** {reason or 'Not specified'}\n- **Required Solution:** {solution or 'Follow standard Pine Labs operational procedure'}"
    
    kw = list(set(tokenize(title) + tokenize(reason) + tokenize(solution)))
    chunks.append({
        "id": chunk_id,
        "source": "Errors_Issue_and_their_resolution_steps.xlsx [Plutus EDC Issue_Errors]",
        "title": title,
        "category": "POS_ERROR",
        "content": content,
        "keywords": kw,
        "errorIssue": issue,
        "reasonOfOccurrence": reason,
        "solution": solution
    })

# 1.2 UPI Issues
ws_upi = wb_err['UPI Issues']
print(f"  Parsing UPI Issues ({ws_upi.max_row} rows)...")
for r in range(2, ws_upi.max_row + 1):
    sno = ws_upi.cell(row=r, column=1).value
    issue = clean_text(ws_upi.cell(row=r, column=2).value)
    reason = clean_text(ws_upi.cell(row=r, column=3).value)
    solution = clean_text(ws_upi.cell(row=r, column=4).value)
    bau = clean_text(ws_upi.cell(row=r, column=5).value)
    
    if not issue and not reason and not solution:
        continue
    
    chunk_id = f"upi_err_{r}"
    title = f"UPI Error: {issue}" if issue else f"UPI Issue #{sno}"
    content = f"### {title}\n- **Reason of Occurrence:** {reason or 'Not specified'}\n- **Required Solution:** {solution or 'Not specified'}"
    if bau:
        content += f"\n- **Related BAU / Operations:** {bau}"
        
    kw = list(set(tokenize(title) + tokenize(reason) + tokenize(solution) + tokenize(bau)))
    chunks.append({
        "id": chunk_id,
        "source": "Errors_Issue_and_their_resolution_steps.xlsx [UPI Issues]",
        "title": title,
        "category": "UPI_ERROR",
        "content": content,
        "keywords": kw,
        "errorIssue": issue,
        "reasonOfOccurrence": reason,
        "solution": solution
    })

# ==============================================================================
# 2. PARSE Key_RT_Pain_Points___SOP.xlsx
# ==============================================================================
print(f"\nLoading {FILE_SOP}...")
wb_sop = openpyxl.load_workbook(FILE_SOP, data_only=True)

# 2.1 Key Points
ws_kp = wb_sop['Key Points']
print(f"  Parsing Key Points ({ws_kp.max_row} rows)...")
for r in range(2, ws_kp.max_row + 1):
    summary = clean_text(ws_kp.cell(row=r, column=1).value)
    rec = clean_text(ws_kp.cell(row=r, column=2).value)
    impact = clean_text(ws_kp.cell(row=r, column=3).value)
    impact_type = clean_text(ws_kp.cell(row=r, column=4).value)
    rca = clean_text(ws_kp.cell(row=r, column=5).value)
    outcome = clean_text(ws_kp.cell(row=r, column=6).value)
    remarks = clean_text(ws_kp.cell(row=r, column=9).value)
    
    if not summary:
        continue
        
    title = summary[:80] + ("..." if len(summary) > 80 else "")
    content = f"### Operational Issue / RT Pain Point: {summary}\n- **Recommendation / Action:** {rec}\n"
    if rca:
        content += f"- **RCA (Root Cause Analysis):** {rca}\n"
    if impact:
        content += f"- **Impact:** {impact} ({impact_type})\n"
    if outcome:
        content += f"- **Outcome / Status:** {outcome}\n"
    if remarks:
        content += f"- **Remarks:** {remarks}\n"
        
    kw = list(set(tokenize(summary) + tokenize(rec) + tokenize(rca)))
    chunks.append({
        "id": f"sop_key_points_{r}",
        "source": "Key_RT_Pain_Points___SOP.xlsx [Key Points]",
        "title": title,
        "category": "SOP_INSIGHT",
        "content": content,
        "keywords": kw
    })

# 2.2 Other key Points
ws_okp = wb_sop['Other key Points']
print(f"  Parsing Other key Points ({ws_okp.max_row} rows)...")
for r in range(2, ws_okp.max_row + 1):
    summary = clean_text(ws_okp.cell(row=r, column=2).value)
    rec = clean_text(ws_okp.cell(row=r, column=3).value)
    impact = clean_text(ws_okp.cell(row=r, column=4).value)
    
    if not summary:
        continue
        
    title = summary[:80] + ("..." if len(summary) > 80 else "")
    content = f"### SOP Guideline: {summary}\n- **Operational Solution / Recommendation:** {rec}\n"
    if impact:
        content += f"- **Impact:** {impact}\n"
        
    kw = list(set(tokenize(summary) + tokenize(rec)))
    chunks.append({
        "id": f"sop_other_points_{r}",
        "source": "Key_RT_Pain_Points___SOP.xlsx [Other key Points]",
        "title": title,
        "category": "SOP_INSIGHT",
        "content": content,
        "keywords": kw
    })

# 2.3 KMS Update
ws_kms = wb_sop['KMS Update']
print(f"  Parsing KMS Update ({ws_kms.max_row} rows)...")
for r in range(2, ws_kms.max_row + 1):
    err = clean_text(ws_kms.cell(row=r, column=2).value)
    sol = clean_text(ws_kms.cell(row=r, column=3).value)
    if not err and not sol:
        continue
    title = f"KMS Update: {err[:80]}"
    content = f"### {title}\n- **Problem Statement / Request:** {err}\n- **Solution / Guidance:** {sol or 'Refer to associated SOP steps'}"
    kw = list(set(tokenize(err) + tokenize(sol)))
    chunks.append({
        "id": f"sop_kms_{r}",
        "source": "Key_RT_Pain_Points___SOP.xlsx [KMS Update]",
        "title": title,
        "category": "SOP_INSIGHT",
        "content": content,
        "keywords": kw
    })

# 2.4 Steps
ws_steps = wb_sop['Steps']
print(f"  Parsing Steps ({ws_steps.max_row} rows)...")
for r in range(2, ws_steps.max_row + 1):
    sol = clean_text(ws_steps.cell(row=r, column=2).value)
    steps = clean_text(ws_steps.cell(row=r, column=3).value)
    if not sol and not steps:
        continue
    title = f"Procedure: {sol[:80]}"
    content = f"### {title}\n{steps}"
    kw = list(set(tokenize(sol) + tokenize(steps)))
    chunks.append({
        "id": f"sop_steps_{r}",
        "source": "Key_RT_Pain_Points___SOP.xlsx [Steps]",
        "title": title,
        "category": "HOW_TO",
        "content": content,
        "keywords": kw
    })

# 2.5 TID Issue_WIP
ws_tid = wb_sop['TID Issue_WIP']
print(f"  Parsing TID Issue_WIP ({ws_tid.max_row} rows)...")
for r in range(2, ws_tid.max_row + 1):
    bank = clean_text(ws_tid.cell(row=r, column=1).value)
    exact_err = clean_text(ws_tid.cell(row=r, column=2).value)
    res_steps = clean_text(ws_tid.cell(row=r, column=3).value)
    spoc_to = clean_text(ws_tid.cell(row=r, column=4).value)
    spoc_cc = clean_text(ws_tid.cell(row=r, column=5).value)
    
    if not bank and not exact_err:
        continue
        
    title = f"TID Exception: {bank} — {exact_err}"
    content = f"### Bank TID Routing: {bank} — {exact_err}\n- **Resolution Steps:** {res_steps}\n- **Bank Contact (TO):** {spoc_to}\n- **Bank Contact (CC):** {spoc_cc}"
    kw = list(set(tokenize(bank) + tokenize(exact_err) + tokenize(res_steps) + tokenize(spoc_to)))
    chunks.append({
        "id": f"sop_tid_wip_{r}",
        "source": "Key_RT_Pain_Points___SOP.xlsx [TID Issue_WIP]",
        "title": title,
        "category": "ESCALATION_CONTACT",
        "content": content,
        "keywords": kw
    })

# 2.6 Bank Escalation Matrix (69 rows)
ws_esc = wb_sop['Bank Escalation Matrix']
print(f"  Parsing Bank Escalation Matrix ({ws_esc.max_row} rows)...")
for r in range(3, ws_esc.max_row + 1):
    row_vals = [clean_text(ws_esc.cell(row=r, column=c).value) for c in range(1, 18)]
    if not any(row_vals):
        continue
    
    bank_name = row_vals[0] or row_vals[1] or f"Escalation Row {r}"
    title = f"Bank Escalation Matrix: {bank_name} (Row {r})"
    content = f"### Bank Escalation: {bank_name}\n" + "\n".join([f"- {v}" for v in row_vals if v])
    kw = list(set(tokenize(" ".join(row_vals))))
    
    chunks.append({
        "id": f"bank_escalation_matrix_{r}",
        "source": "Key_RT_Pain_Points___SOP.xlsx [Bank Escalation Matrix]",
        "title": title,
        "category": "ESCALATION_CONTACT",
        "content": content,
        "keywords": kw,
        "rawRow": row_vals
    })

# 2.7 PBL
ws_pbl = wb_sop['PBL']
print(f"  Parsing PBL ({ws_pbl.max_row} rows)...")
for r in range(1, ws_pbl.max_row + 1):
    c1 = clean_text(ws_pbl.cell(row=r, column=1).value)
    c2 = clean_text(ws_pbl.cell(row=r, column=2).value)
    txt = f"{c1} {c2}".strip()
    if not txt:
        continue
    title = f"PayByLink (PBL) Rule #{r}"
    content = f"### PayByLink (PBL) Architecture & Rules\n{txt}"
    kw = list(set(tokenize(txt)))
    chunks.append({
        "id": f"sop_pbl_{r}",
        "source": "Key_RT_Pain_Points___SOP.xlsx [PBL]",
        "title": title,
        "category": "SOP_INSIGHT",
        "content": content,
        "keywords": kw
    })

# ==============================================================================
# 3. PARSE POS Guide.docx
# ==============================================================================
print(f"\nLoading {FILE_DOCX}...")
doc = docx.Document(FILE_DOCX)
print(f"  Parsing POS Guide.docx ({len(doc.paragraphs)} paragraphs)...")

guide_sections = [
    {
        "id": "guide_bank_emi",
        "title": "Bank EMI Transactions on Plutus Smart POS (Credit / Debit)",
        "keywords": ["bank", "emi", "tenure", "invoice", "debit", "credit", "interest", "subvention", "installment", "how", "process"],
        "content": """### Bank EMI Transactions with Plutus Smart PoS (Debit / Credit)
**Operational Flow on Plutus Smart:**
1. Tap the **Payments** tab on the Home app.
2. Tap **Accept payment**.
3. Tap anywhere on the card dip/swipe screen to view payment options.
4. Tap **Bank EMI Payment Mode**.
5. **Dip or swipe** the customer's debit or credit card on the device.
6. Enter the transaction **Amount**.
7. Enter the **Invoice number**.
8. Select **Tenure** from available options (e.g. 3, 6, 9, 12+ months).
9. Have the customer enter their **ATM PIN**.
10. Once transaction is successful, print the charge slip and proceed to customer feedback."""
    },
    {
        "id": "guide_void_transaction",
        "title": "Void Transaction / Cancel Payment on Plutus Smart POS",
        "keywords": ["void", "cancel", "refund", "reversal", "transaction id", "charge slip", "undo", "return", "how"],
        "content": """### How to Void a Transaction on Plutus Smart PoS
**Steps to cancel a sales transaction:**
1. Tap the **Payments** tab on the Home app.
2. Tap **Accept Payments**.
3. Tap anywhere on the card dip or swipe screen to view payment options.
4. Tap **Void**.
5. Enter the **Transaction ID** of the sales transaction (*Note: Transaction ID is printed on the original charge slip of the sale*).
6. On transaction success, print the void charge slip for merchant and customer records."""
    },
    {
        "id": "guide_settle_batch",
        "title": "Transaction Settlement (Settle Batch) on Plutus Smart POS",
        "keywords": ["settle", "batch", "settlement", "close batch", "end of day", "eod", "reconciliation"],
        "content": """### Transaction Settlement (Settle Batch) on Plutus Smart PoS
**Steps to Settle a Batch at the end of the day:**
1. Tap the **Menu** (☰) on the Home app.
2. Select **Settle Batch** from the menu options.
3. The terminal connects to the acquiring switch and reconciles daily transactions.
4. On transaction success, print the settlement summary charge slip for store audit."""
    },
    {
        "id": "guide_upi_payments",
        "title": "UPI Payments on Plutus Smart POS",
        "keywords": ["upi", "qr", "dynamic qr", "gpay", "phonepe", "paytm", "bhim", "scan"],
        "content": """### UPI Safe Transaction Flow on Plutus Smart PoS
**Steps to accept UPI payments:**
1. Tap the **Payments** tab on the Home app.
2. Tap **Accept Payments**.
3. Tap anywhere on the card dip or swipe screen to view payment options.
4. Tap **UPI Payment Mode** -> Select **UPI Sale Request**.
5. Enter the bill **Amount**.
6. A dynamic QR code displays on the POS screen — customer scans it with any UPI app (GPay, PhonePe, Paytm, BHIM, etc.).
7. Customer authorizes payment by entering their UPI PIN on their phone.
8. Terminal beeps upon switch approval, prints the charge slip, and prompts for customer feedback."""
    },
    {
        "id": "guide_bharat_qr",
        "title": "Bharat QR Payments on Plutus Smart POS",
        "keywords": ["bharat qr", "bqr", "qr code", "scan and pay"],
        "content": """### Bharat QR Payments on Plutus Smart PoS
**Steps to accept Bharat QR transactions:**
1. Tap the **Payments** tab on the Home app.
2. Tap **Accept Payment**.
3. Tap anywhere on the card dip or swipe screen for options.
4. Select **Bharat QR Payment Mode** -> Tap **Bharat QR Sale Request**.
5. Enter transaction **Amount**.
6. Customer scans the Bharat QR with their banking app and enters their PIN.
7. Terminal approves the payment and prints the charge slip."""
    },
    {
        "id": "guide_dip_swipe_card",
        "title": "Dip and Swipe Card Payments on Plutus Smart POS",
        "keywords": ["dip", "swipe", "card sale", "credit card", "debit card", "pin", "chip"],
        "content": """### Mastering Dip and Swipe Card Payments on Plutus Smart PoS
**Steps for Credit/Debit card sale:**
1. Select the **Sale Transaction** tab on the Home app.
2. **Dip** (chip side into front slot) or **Swipe** (magstripe through side slot) the card.
3. Enter the transaction **Amount**.
4. Enter the customer's **10-digit mobile number** (for digital charge slip).
5. Have the customer enter their **ATM PIN** on the screen/keypad.
6. Once authorized, print the physical charge slip."""
    },
    {
        "id": "guide_tap_and_pay",
        "title": "Tap and Pay (Contactless NFC) Payments on Plutus Smart POS",
        "keywords": ["tap", "contactless", "nfc", "wave", "apple pay", "google wallet"],
        "content": """### Tap and Pay (Contactless NFC) on Plutus Smart PoS
**Steps for contactless payment:**
1. Select the **Sale Transaction** tab on the Home app.
2. Enter the transaction **Amount**.
3. Ask the customer to **Tap their contactless card** or NFC-enabled phone near the contactless symbol on the display.
4. If transaction exceeds contactless threshold, customer enters PIN.
5. On authorization, print the charge slip."""
    },
    {
        "id": "guide_dcc_currency",
        "title": "Dynamic Currency Conversion (DCC) for International Cards",
        "keywords": ["dcc", "dynamic currency conversion", "international", "foreign card", "usd", "eur", "gbp", "exchange rate"],
        "content": """### Dynamic Currency Conversion (DCC) on Plutus Smart PoS
**Flow for foreign/international cardholders:**
1. Select the **Sale Transaction** tab on the Home app.
2. Tap **Accept Payment**.
3. **Dip or swipe** the foreign debit or credit card.
4. Enter the amount in INR.
5. The terminal identifies the foreign card and displays the customer's home currency conversion rate.
6. Select the customer's **preferred currency** (their home currency vs INR).
7. Customer enters PIN or signs on screen.
8. Terminal prints charge slip displaying conversion rate and final billed amount."""
    },
    {
        "id": "guide_wifi_troubleshooting",
        "title": "Wi-Fi Connectivity Setup & Troubleshooting on Plutus Smart POS",
        "keywords": ["wifi", "wi-fi", "internet", "network", "connect", "offline", "not connecting", "2.4ghz", "security", "disable web and none", "activate terminal"],
        "content": """### Wi-Fi Connectivity Setup & Troubleshooting on Plutus Smart PoS
**Primary Fix (Set Connection & Priority):**
1. Open the **Payments app** on your terminal.
2. Open the menu by tapping the **three horizontal lines (☰)** in the top-left.
3. Tap **Set connection** from the menu options.
4. Ensure **Wi-Fi** is placed at the top (Priority 1). If not, drag the Wi-Fi option to the very top.
5. Tap **Wi-Fi** to open Communication Setup -> Toggle the button **ON** -> Tap **Submit**.
6. Swipe down from the top edge of the screen to open Android **Quick Settings Panel**.
7. Tap the Wi-Fi icon, select your store network, enter the password, and tap **Connect**.
8. Return to the Payments app menu and tap **Activate** to activate the terminal.

**Secondary Fix (If still unable to connect / Security Exception):**
1. Go to terminal Home screen -> Open Android **Settings** app.
2. Tap **Security** -> Find **"disable web and none"** option.
3. If active, tap toggle button to **OFF** (confirm 'Yes').
4. Swipe down Quick Settings -> Turn Wi-Fi on -> Connect to your network.
5. Return to Payments app menu and tap **Activate**.
6. Perform a test transaction from the Home app to confirm resolution.

*Important Note from SOP:* Plutus terminals do NOT detect 5 GHz Wi-Fi bands. The terminal only supports 2.4 GHz frequency. Ensure your router's 2.4 GHz band is broadcasted."""
    }
]

for g in guide_sections:
    g["source"] = "POS Guide.docx"
    g["category"] = "HOW_TO"
    chunks.append(g)

print(f"\n=======================================================")
print(f"TOTAL CHUNKS GENERATED: {len(chunks)}")
print(f"Categories: {set(c['category'] for c in chunks)}")
print(f"=======================================================")

# Output to JSON and JS
out_json_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "knowledgeCorpus.json")
out_js_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "knowledgeCorpus.js")

with open(out_json_path, "w", encoding="utf-8") as f:
    json.dump(chunks, f, indent=2, ensure_ascii=False)

with open(out_js_path, "w", encoding="utf-8") as f:
    f.write("// Auto-generated Knowledge Corpus from official source documents:\n")
    f.write("// - Errors_Issue_and_their_resolution_steps.xlsx (Plutus EDC, UPI Issues)\n")
    f.write("// - Key_RT_Pain_Points___SOP.xlsx (Key Points, KMS, Steps, TID WIP, Bank Escalation Matrix, PBL)\n")
    f.write("// - POS Guide.docx (All procedural How-To guides)\n\n")
    f.write(f"export const KNOWLEDGE_CORPUS = {json.dumps(chunks, indent=2, ensure_ascii=False)};\n\n")
    f.write(f"export const TOTAL_CHUNKS_COUNT = {len(chunks)};\n")

print(f"Successfully saved to:\n  - {out_json_path}\n  - {out_js_path}")
