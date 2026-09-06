from html import escape
from ..models import models
from .serializers import invoice_number_for, serialize_order


def _fmt_money(value) -> str:
    return f"{float(value or 0):,.2f}"


def _fmt_dt(value) -> str:
    if not value:
        return "-"
    try:
        return value.strftime("%d/%m/%Y %H:%M")
    except Exception:
        return str(value)


def build_invoice_html(order: models.Order) -> str:
    data = serialize_order(order)
    invoice_no = invoice_number_for(order)
    items_html = []
    for idx, item in enumerate(data.items, start=1):
        items_html.append(
            f"""
            <tr>
              <td>{idx}</td>
              <td>{escape(item.name or f'สินค้า #{item.product_id}')}</td>
              <td class="num">{item.quantity}</td>
              <td class="num">{_fmt_money(item.unit_price)}</td>
              <td class="num">{_fmt_money(item.subtotal)}</td>
            </tr>
            """
        )
    payment_label = {
        "promptpay": "พร้อมเพย์",
        "bank": "โอนธนาคาร",
        "cod": "เก็บเงินปลายทาง",
    }.get((data.payment_method or "").lower(), data.payment_method or "-")

    return f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>ใบกำกับสินค้า {escape(invoice_no)}</title>
  <style>
    body {{ font-family: "Sarabun", "Noto Sans Thai", sans-serif; color: #1f2937; margin: 0; background: #f8f4ef; }}
    .sheet {{ max-width: 800px; margin: 24px auto; background: #fff; padding: 36px 40px; box-shadow: 0 8px 30px rgba(0,0,0,.08); }}
    .brand {{ display:flex; justify-content:space-between; gap: 16px; border-bottom: 3px solid #b85434; padding-bottom: 16px; }}
    h1 {{ margin: 0; font-size: 28px; color: #8c3619; }}
    .muted {{ color:#6b7280; font-size: 13px; }}
    .meta {{ display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }}
    .box {{ border:1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; background:#faf7f4; }}
    table {{ width:100%; border-collapse: collapse; margin-top: 8px; }}
    th, td {{ padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; }}
    th {{ background:#f3ece6; text-align:left; }}
    .num {{ text-align:right; }}
    .totals {{ width: 280px; margin-left:auto; margin-top: 16px; }}
    .totals div {{ display:flex; justify-content:space-between; padding: 6px 0; }}
    .grand {{ font-weight:800; font-size: 18px; color:#8c3619; border-top:2px solid #b85434; padding-top: 8px; }}
    .actions {{ margin: 20px auto; max-width: 800px; text-align:center; }}
    .actions button {{ background:#b85434; color:#fff; border:0; padding:10px 18px; border-radius:8px; cursor:pointer; font-size:15px; }}
    @media print {{
      body {{ background:#fff; }}
      .actions {{ display:none; }}
      .sheet {{ box-shadow:none; margin:0; }}
    }}
  </style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button></div>
  <div class="sheet">
    <div class="brand">
      <div>
        <h1>ใบกำกับสินค้า</h1>
        <div class="muted">OTOP Connect · ตลาดชุมชนและภูมิปัญญาไทย</div>
        <div class="muted">เอกสารประกอบการสั่งซื้อสินค้า OTOP (ไม่ใช่ใบกำกับภาษี)</div>
      </div>
      <div style="text-align:right">
        <div><strong>เลขที่</strong> {escape(invoice_no)}</div>
        <div class="muted">คำสั่งซื้อ #{data.id}</div>
        <div class="muted">วันที่ {_fmt_dt(data.created_at)}</div>
      </div>
    </div>
    <div class="meta">
      <div class="box">
        <strong>ผู้ซื้อ / ผู้รับสินค้า</strong>
        <div>{escape(data.customer_name or "-")}</div>
        <div class="muted">{escape(data.customer_email or "")}</div>
        <div class="muted">{escape(data.customer_phone or "")}</div>
        <div style="margin-top:8px">{escape(data.shipping_address or "-")}</div>
      </div>
      <div class="box">
        <strong>ผู้ขาย / แพลตฟอร์ม</strong>
        <div>OTOP Connect Marketplace</div>
        <div class="muted">ช่องทางชำระเงิน: {escape(payment_label)}</div>
        <div class="muted">สถานะคำสั่งซื้อ: {escape(data.order_status)}</div>
        {f'<div class="muted">เลขพัสดุ: {escape(data.tracking_number)}</div>' if data.tracking_number else ''}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>รายการสินค้า</th>
          <th class="num">จำนวน</th>
          <th class="num">ราคา/หน่วย</th>
          <th class="num">รวม</th>
        </tr>
      </thead>
      <tbody>
        {''.join(items_html)}
      </tbody>
    </table>
    <div class="totals">
      <div><span>รวมสินค้า</span><span>{_fmt_money(data.total_price)} บาท</span></div>
      <div><span>ส่วนลด</span><span>- {_fmt_money(data.discount_amount)} บาท</span></div>
      <div><span>ค่าจัดส่ง</span><span>{_fmt_money(data.shipping_cost)} บาท</span></div>
      <div class="grand"><span>ยอดสุทธิ</span><span>{_fmt_money(data.grand_total)} บาท</span></div>
    </div>
    <p class="muted" style="margin-top:28px">เอกสารนี้ออกโดยระบบ OTOP Connect เพื่อให้ลูกค้าใช้ตรวจสอบรายการสั่งซื้อ เปิดดู และดาวน์โหลดได้</p>
  </div>
</body>
</html>
"""
