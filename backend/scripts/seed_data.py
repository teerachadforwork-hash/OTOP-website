"""
OTOP Connect — Comprehensive Database Seed Script
Seeds realistic Thai OTOP products, communities, categories, users, orders, and reviews.
"""
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.database import engine, SessionLocal, Base
from app.models.models import (
    User, Community, Category, Product, Order, OrderItem, Payment, Review,
    RoleEnum, OrderStatusEnum, PaymentStatusEnum, ProductStatusEnum
)
import bcrypt

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    try:
        # ============================
        # 1. USERS
        # ============================
        admin = User(
            email="admin@otop.th",
            hashed_password=hash_pw("admin123"),
            full_name="ผู้ดูแลระบบ OTOP Connect",
            phone_number="0800000001",
            role=RoleEnum.admin.value,
            is_active=True,
        )
        seller1 = User(
            email="seller@otop.th",
            hashed_password=hash_pw("seller123"),
            full_name="สมศรี ภูมิปัญญา",
            phone_number="0812345678",
            role=RoleEnum.seller.value,
            is_active=True,
        )
        seller2 = User(
            email="seller2@otop.th",
            hashed_password=hash_pw("seller123"),
            full_name="ประสิทธิ์ ช่างฝีมือ",
            phone_number="0898765432",
            role=RoleEnum.seller.value,
            is_active=True,
        )
        customer = User(
            email="customer@otop.th",
            hashed_password=hash_pw("customer123"),
            full_name="วิภาดา ใจดี",
            phone_number="0823456789",
            role=RoleEnum.customer.value,
            is_active=True,
        )
        customer2 = User(
            email="customer2@otop.th",
            hashed_password=hash_pw("customer123"),
            full_name="สมชาย ลูกค้าประจำ",
            phone_number="0834567890",
            role=RoleEnum.customer.value,
            is_active=True,
        )
        db.add_all([admin, seller1, seller2, customer, customer2])
        db.flush()
        print(f"Created users: admin={admin.id}, seller1={seller1.id}, seller2={seller2.id}, customer={customer.id}")

        # ============================
        # 2. CATEGORIES
        # ============================
        categories_data = [
            ("ผ้าและเครื่องแต่งกาย", "🧵", "ผ้าทอมือ ผ้าไหม ผ้าบาติก เครื่องแต่งกายพื้นเมือง"),
            ("อาหารและเครื่องดื่ม", "🍵", "อาหารแปรรูป ขนม เครื่องดื่มสมุนไพร"),
            ("ของใช้และของตกแต่ง", "🏺", "เครื่องปั้นดินเผา เซรามิก งานไม้แกะสลัก"),
            ("สมุนไพรและสุขภาพ", "🌿", "สมุนไพรไทย ผลิตภัณฑ์เพื่อสุขภาพ สปา"),
            ("หัตถกรรมพื้นบ้าน", "🧺", "จักสาน เครื่องเงิน เครื่องจักสาน งานหัตถศิลป์"),
            ("ของฝากและของที่ระลึก", "🎁", "ของฝากประจำจังหวัด ของที่ระลึก ของขวัญ"),
        ]
        categories = []
        for name, icon, desc in categories_data:
            cat = Category(name=name, icon_name=icon, description=desc)
            db.add(cat)
            categories.append(cat)
        db.flush()
        print(f"Created {len(categories)} categories")

        # ============================
        # 3. COMMUNITIES
        # ============================
        communities_data = [
            {
                "name": "กลุ่มทอผ้าย้อมครามบ้านดอนกอย",
                "province": "สกลนคร",
                "district": "พรรณนานิคม",
                "subdistrict": "ดอนกอย",
                "description": "กลุ่มวิสาหกิจชุมชนทอผ้าย้อมครามธรรมชาติ สืบสานภูมิปัญญาการย้อมครามอายุกว่า 200 ปี",
                "history": "ชุมชนบ้านดอนกอยมีวิถีชีวิตผูกพันกับการทอผ้าและย้อมครามมาตั้งแต่บรรพบุรุษ สืบทอดกันมากว่า 5 ชั่วอายุคน",
                "story": "ผ้าครามดอนกอยเป็นที่รู้จักระดับนานาชาติ ด้วยกรรมวิธีการย้อมครามแบบดั้งเดิมที่ใช้วัตถุดิบจากธรรมชาติ 100% ย้อม 8-12 แดด ทำให้สีครามนุ่มลึกงดงาม",
                "banner_image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1200&q=80",
                "contact_phone": "042-123-456",
                "contact_email": "donkoi.kram@gmail.com",
            },
            {
                "name": "ศิลาดลเชียงใหม่หัตถศิลป์",
                "province": "เชียงใหม่",
                "district": "สันกำแพง",
                "subdistrict": "สันกำแพง",
                "description": "กลุ่มช่างเซรามิกศิลาดลที่สืบสานศิลปะการเคลือบศิลาดลอันเป็นเอกลักษณ์ของล้านนา",
                "history": "ศิลาดลเชียงใหม่มีต้นกำเนิดจากเตาเผาสันกำแพง มีประวัติยาวนานกว่า 700 ปี ตั้งแต่สมัยราชวงศ์มังราย",
                "story": "เซรามิกศิลาดลมีเอกลักษณ์ที่การเคลือบผิวรานธรรมชาติ (celadon crackle) ที่สวยงามไม่ซ้ำกัน ใช้ขี้เถ้าไม้ธรรมชาติในการเคลือบ",
                "banner_image": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80",
                "contact_phone": "053-234-567",
                "contact_email": "celadon.cm@gmail.com",
            },
            {
                "name": "วิสาหกิจหม้อฮ่อมเมืองแพร่",
                "province": "แพร่",
                "district": "เมืองแพร่",
                "subdistrict": "ในเวียง",
                "description": "กลุ่มผลิตเสื้อผ้าม่อฮ่อมย้อมครามธรรมชาติ สัญลักษณ์ประจำจังหวัดแพร่",
                "history": "หม้อฮ่อมเมืองแพร่เป็นภูมิปัญญาท้องถิ่นที่สืบทอดมากว่า 100 ปี เป็นเอกลักษณ์ของชาวเมืองแพร่",
                "story": "ม่อฮ่อมคือเสื้อผ้าย้อมครามสีน้ำเงินเข้มที่เป็นสัญลักษณ์ของจังหวัดแพร่ ใช้วัสดุธรรมชาติ 100% ผสมผสานดีไซน์ร่วมสมัย",
                "banner_image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80",
                "contact_phone": "054-345-678",
                "contact_email": "mohom.phrae@gmail.com",
            },
            {
                "name": "กลุ่มจักสานกระจูดทะเลน้อย",
                "province": "พัทลุง",
                "district": "ควนขนุน",
                "subdistrict": "ทะเลน้อย",
                "description": "กลุ่มช่างจักสานกระจูดฝีมือประณีต ผสมผสานการออกแบบสมัยใหม่เข้ากับภูมิปัญญาท้องถิ่นภาคใต้",
                "history": "ชุมชนทะเลน้อยอาศัยอยู่ริมทะเลสาบสงขลา ใช้กระจูดจากพื้นที่ชุ่มน้ำมาสานเป็นเครื่องใช้ต่างๆ มาหลายร้อยปี",
                "story": "กระจูดทะเลน้อยมีเส้นละเอียดนุ่ม ทนทาน เป็นมิตรกับสิ่งแวดล้อม ผลิตภัณฑ์ถูกยกระดับสู่แบรนด์ร่วมสมัยจนเป็นที่นิยมระดับสากล",
                "banner_image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
                "contact_phone": "074-456-789",
                "contact_email": "krajood.thalenoi@gmail.com",
            },
            {
                "name": "กลุ่มแม่บ้านทอผ้าบ้านกิ่วม่วง",
                "province": "น่าน",
                "district": "ปัว",
                "subdistrict": "ปัว",
                "description": "กลุ่มทอผ้าพื้นเมืองน่าน ลวดลายโบราณของชาวไทลื้อ ผ้าทอมือคุณภาพสูง",
                "history": "ชาวไทลื้อบ้านกิ่วม่วงสืบทอดการทอผ้าลายน้ำไหลและลายต่างๆ มาตั้งแต่อพยพจากสิบสองปันนา",
                "story": "ผ้าทอน่านมีลวดลายเอกลักษณ์ เช่น ลายน้ำไหล ลายดอกแก้ว ทอด้วยกี่เอวแบบดั้งเดิม ให้สีสันสดใสจากสีธรรมชาติ",
                "banner_image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1200&q=80",
                "contact_phone": "054-567-890",
                "contact_email": "kiwmuang.nan@gmail.com",
            },
            {
                "name": "วิสาหกิจชุมชนเกษตรอินทรีย์แม่กลอง",
                "province": "สมุทรสงคราม",
                "district": "อัมพวา",
                "subdistrict": "อัมพวา",
                "description": "กลุ่มเกษตรกรอินทรีย์ที่ผลิตอาหารแปรรูปและสมุนไพรจากวัตถุดิบธรรมชาติ 100%",
                "history": "ชุมชนริมคลองแม่กลองมีวิถีเกษตรกรรมมายาวนาน ผสมผสานภูมิปัญญาการแปรรูปอาหารและสมุนไพรไทย",
                "story": "ผลิตภัณฑ์จากชุมชนแม่กลองเน้นวัตถุดิบออร์แกนิก ปลอดสารเคมี ใช้กรรมวิธีดั้งเดิมของชาวสวนลุ่มน้ำแม่กลอง",
                "banner_image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80",
                "contact_phone": "034-678-901",
                "contact_email": "organic.maeklong@gmail.com",
            },
        ]
        communities = []
        for cd in communities_data:
            comm = Community(**cd)
            db.add(comm)
            communities.append(comm)
        db.flush()
        print(f"Created {len(communities)} communities")

        # ============================
        # 4. PRODUCTS
        # ============================
        products_data = [
            # Community 1: ผ้าย้อมคราม สกลนคร
            {
                "seller_id": seller1.id,
                "community_id": communities[0].id,
                "category_id": categories[0].id,
                "name": "ผ้าคลุมไหล่ย้อมครามธรรมชาติ ลายเกล็ดพญานาค",
                "description": "ผ้าฝ้ายเข็นมือ ย้อมครามธรรมชาติ 8 แดด ลวดลายโบราณ นุ่มสบาย ไม่ระคายเคืองผิว เหมาะสำหรับทุกโอกาส",
                "story": "ลายเกล็ดพญานาคเป็นลายศักดิ์สิทธิ์ของชาวอีสาน สื่อถึงความเป็นสิริมงคลและความอุดมสมบูรณ์ ย้อมด้วยครามแท้จากต้นครามที่ปลูกในชุมชน",
                "price": 850.0,
                "stock": 25,
                "province": "สกลนคร",
                "hero_image": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.9,
                "review_count": 142,
                "status": ProductStatusEnum.approved.value,
            },
            {
                "seller_id": seller1.id,
                "community_id": communities[0].id,
                "category_id": categories[3].id,
                "name": "สบู่กากครามผสมน้ำผึ้งป่าธรรมชาติ 100%",
                "description": "ช่วยดูดซับความมันและสิ่งสกปรก อุดมด้วยสารต้านอนุมูลอิสระจากกากครามแท้ ผสมน้ำผึ้งป่าบำรุงผิว",
                "story": "สบู่จากกากครามที่เหลือจากกระบวนการย้อมผ้า ไม่ทิ้งให้สูญเปล่า นำมาแปรรูปเป็นผลิตภัณฑ์ดูแลผิว Zero Waste",
                "price": 120.0,
                "stock": 80,
                "province": "สกลนคร",
                "hero_image": "https://images.unsplash.com/photo-1607006311829-0745c229986b?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 5.0,
                "review_count": 94,
                "status": ProductStatusEnum.approved.value,
            },
            # Community 2: ศิลาดลเชียงใหม่
            {
                "seller_id": seller1.id,
                "community_id": communities[1].id,
                "category_id": categories[2].id,
                "name": "ชุดจานชามเซรามิกศิลาดลเคลือบขี้เถ้าธรรมชาติ",
                "description": "เซรามิกศิลาดลเคลือบผิวรานธรรมชาติอันเป็นเอกลักษณ์ ปลอดสารตะกั่ว เข้าไมโครเวฟได้ ชุดละ 4 ชิ้น",
                "story": "ศิลาดลเชียงใหม่สืบทอดเทคนิคโบราณกว่า 700 ปี แต่ละชิ้นมีลวดลายรานที่ไม่ซ้ำกัน เปรียบเสมือนลายนิ้วมือของธรรมชาติ",
                "price": 690.0,
                "stock": 15,
                "province": "เชียงใหม่",
                "hero_image": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.9,
                "review_count": 118,
                "status": ProductStatusEnum.approved.value,
            },
            {
                "seller_id": seller1.id,
                "community_id": communities[1].id,
                "category_id": categories[2].id,
                "name": "แจกันศิลาดลรูปทรงน้ำเต้าเคลือบเขียวมรกต",
                "description": "แจกันทรงคลาสสิค เคลือบสีเขียวมรกตงดงาม ขนาดสูง 25 ซม. เหมาะสำหรับตกแต่งบ้านและเป็นของขวัญ",
                "story": "รูปทรงน้ำเต้าเป็นสัญลักษณ์แห่งความมั่งคั่งและสุขภาพดี สีเขียวมรกตได้จากสูตรเคลือบโบราณที่สืบทอดกันมา",
                "price": 1200.0,
                "stock": 8,
                "province": "เชียงใหม่",
                "hero_image": "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.8,
                "review_count": 45,
                "status": ProductStatusEnum.approved.value,
            },
            # Community 3: หม้อฮ่อมแพร่
            {
                "seller_id": seller2.id,
                "community_id": communities[2].id,
                "category_id": categories[0].id,
                "name": "เสื้อเชิ้ตผ้าครามหม้อฮ่อมร่วมสมัย",
                "description": "ตัดเย็บเนี้ยบ ระบายอากาศได้ดีเยี่ยม สวมใส่ได้ทุกโอกาส งานฝีมือชั้นครู ผ้าย้อมครามแท้จากเมืองแพร่",
                "story": "ม่อฮ่อมคือตำนานแห่งเมืองแพร่ จากชุดทำงานของชาวนาสู่แฟชั่นร่วมสมัยที่ได้รับความนิยมทั่วโลก ทุกตัวย้อมด้วยมือ",
                "price": 1450.0,
                "stock": 20,
                "province": "แพร่",
                "hero_image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.8,
                "review_count": 86,
                "status": ProductStatusEnum.approved.value,
            },
            {
                "seller_id": seller2.id,
                "community_id": communities[2].id,
                "category_id": categories[0].id,
                "name": "กางเกงขาสั้นม่อฮ่อมย้อมคราม Unisex",
                "description": "กางเกงขาสั้นม่อฮ่อมสไตล์ Casual ใส่สบาย เอวยืดหยุ่น ผ้าย้อมครามธรรมชาติ มีกระเป๋าข้าง 2 ใบ",
                "story": "ออกแบบใหม่ให้ทันสมัย เหมาะกับทุกเพศทุกวัย คงเสน่ห์ของผ้าม่อฮ่อมดั้งเดิม",
                "price": 590.0,
                "stock": 35,
                "province": "แพร่",
                "hero_image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.7,
                "review_count": 62,
                "status": ProductStatusEnum.approved.value,
            },
            # Community 4: จักสานกระจูด พัทลุง
            {
                "seller_id": seller2.id,
                "community_id": communities[3].id,
                "category_id": categories[4].id,
                "name": "กระเป๋าสะพายกระจูดสานทรงเหลี่ยม รุ่น Modern",
                "description": "กระเป๋าจักสานกระจูดเส้นละเอียด ซับในผ้า มีซิป ทรง Minimal สุดชิค ใช้ได้ทุกวัน ทนทานเป็นพิเศษ",
                "story": "กระจูดจากทะเลน้อยถูกนำมาสานด้วยฝีมือชาวบ้านที่ชำนาญ แล้วยกระดับดีไซน์ให้ทันสมัย ตอบโจทย์คนรุ่นใหม่",
                "price": 490.0,
                "stock": 30,
                "province": "พัทลุง",
                "hero_image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.9,
                "review_count": 67,
                "status": ProductStatusEnum.approved.value,
            },
            {
                "seller_id": seller2.id,
                "community_id": communities[3].id,
                "category_id": categories[4].id,
                "name": "แจกันกระจูดสานทรงกระบอก ขนาดกลาง",
                "description": "แจกันจักสานกระจูดธรรมชาติ ทรงกระบอก สูง 30 ซม. เหมาะสำหรับจัดดอกไม้แห้งหรือตกแต่งมุมบ้าน",
                "story": "งานจักสานแบบดั้งเดิมที่ผสมผสานกับดีไซน์มินิมอล สร้างบรรยากาศอบอุ่นให้บ้าน",
                "price": 350.0,
                "stock": 40,
                "province": "พัทลุง",
                "hero_image": "https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.6,
                "review_count": 38,
                "status": ProductStatusEnum.approved.value,
            },
            # Community 5: ผ้าน่าน
            {
                "seller_id": seller1.id,
                "community_id": communities[4].id,
                "category_id": categories[0].id,
                "name": "ผ้าพันคอทอมือลายน้ำไหล ไทลื้อน่าน",
                "description": "ผ้าทอมือแบบดั้งเดิมของชาวไทลื้อ ลายน้ำไหลอันเป็นเอกลักษณ์ สีสันจากสีธรรมชาติ นุ่มละมุน",
                "story": "ลายน้ำไหลเป็นลายโบราณของชาวไทลื้อ สื่อถึงสายน้ำที่หล่อเลี้ยงชีวิต ทอด้วยกี่เอวแบบดั้งเดิม ใช้เวลาทอ 2-3 วันต่อผืน",
                "price": 680.0,
                "stock": 18,
                "province": "น่าน",
                "hero_image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.8,
                "review_count": 55,
                "status": ProductStatusEnum.approved.value,
            },
            # Community 6: สมุนไพร สมุทรสงคราม
            {
                "seller_id": seller1.id,
                "community_id": communities[5].id,
                "category_id": categories[1].id,
                "name": "ชาสมุนไพรใบขลู่ออร์แกนิก ชุมชนแม่กลอง",
                "description": "ช่วยลดระดับน้ำตาลในเลือด ขับสารพิษ กลิ่นหอมชื่นใจ ไม่แต่งกลิ่นหรือสี บรรจุ 30 ซอง",
                "story": "ใบขลู่จากริมคลองแม่กลอง ปลูกแบบธรรมชาติ เก็บเกี่ยวตามฤดูกาล ตากแห้งด้วยแสงอาทิตย์",
                "price": 180.0,
                "stock": 50,
                "province": "สมุทรสงคราม",
                "hero_image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.7,
                "review_count": 53,
                "status": ProductStatusEnum.approved.value,
            },
            {
                "seller_id": seller1.id,
                "community_id": communities[5].id,
                "category_id": categories[3].id,
                "name": "น้ำมันมะพร้าวสกัดเย็น Extra Virgin 250ml",
                "description": "มะพร้าวแม่กลองสกัดเย็น 100% บำรุงผิว ผม ปรุงอาหาร ไม่ผ่านสารเคมี หอมกลิ่นมะพร้าวธรรมชาติ",
                "story": "มะพร้าวจากสวนริมแม่น้ำแม่กลอง คัดเฉพาะลูกแก่จัด สกัดเย็นภายใน 24 ชั่วโมง เพื่อรักษาคุณค่าสารอาหาร",
                "price": 280.0,
                "stock": 45,
                "province": "สมุทรสงคราม",
                "hero_image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.6,
                "review_count": 41,
                "status": ProductStatusEnum.approved.value,
            },
            {
                "seller_id": seller2.id,
                "community_id": communities[5].id,
                "category_id": categories[1].id,
                "name": "น้ำตาลมะพร้าวแท้ แม่กลอง 500g",
                "description": "น้ำตาลมะพร้าวแท้ 100% จากสวนชาวบ้าน ไม่ผสมน้ำตาลทราย หอม หวาน กลมกล่อม GI ต่ำ",
                "story": "น้ำตาลมะพร้าวแม่กลองเป็นสิ่งบ่งชี้ทางภูมิศาสตร์ (GI) ที่มีชื่อเสียง ผลิตจากน้ำหวานจากช่อดอกมะพร้าว เคี่ยวด้วยเตาถ่านแบบดั้งเดิม",
                "price": 150.0,
                "stock": 60,
                "province": "สมุทรสงคราม",
                "hero_image": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80",
                "rating_cache": 4.9,
                "review_count": 89,
                "status": ProductStatusEnum.approved.value,
            },
        ]
        products = []
        for pd in products_data:
            product = Product(**pd)
            db.add(product)
            products.append(product)
        db.flush()
        print(f"Created {len(products)} products")

        # ============================
        # 5. ORDERS
        # ============================
        now = datetime.utcnow()

        # Order 1: completed
        order1 = Order(
            customer_id=customer.id,
            total_price=1540.0,
            shipping_cost=50.0,
            grand_total=1590.0,
            shipping_address="123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
            order_status=OrderStatusEnum.completed.value,
            created_at=now - timedelta(days=14),
        )
        db.add(order1)
        db.flush()
        oi1a = OrderItem(order_id=order1.id, product_id=products[0].id, seller_id=seller1.id, unit_price=850.0, quantity=1, subtotal=850.0)
        oi1b = OrderItem(order_id=order1.id, product_id=products[2].id, seller_id=seller1.id, unit_price=690.0, quantity=1, subtotal=690.0)
        db.add_all([oi1a, oi1b])
        pay1 = Payment(order_id=order1.id, amount=1590.0, payment_method="bank_transfer", status=PaymentStatusEnum.paid.value, uploaded_at=now - timedelta(days=13), verified_at=now - timedelta(days=13))
        db.add(pay1)

        # Order 2: shipped
        order2 = Order(
            customer_id=customer.id,
            total_price=1450.0,
            shipping_cost=50.0,
            grand_total=1500.0,
            shipping_address="456 ถ.เจริญกรุง แขวงสี่พระยา เขตบางรัก กรุงเทพฯ 10500",
            order_status=OrderStatusEnum.shipped.value,
            created_at=now - timedelta(days=3),
        )
        db.add(order2)
        db.flush()
        oi2 = OrderItem(order_id=order2.id, product_id=products[4].id, seller_id=seller2.id, unit_price=1450.0, quantity=1, subtotal=1450.0)
        db.add(oi2)
        pay2 = Payment(order_id=order2.id, amount=1500.0, payment_method="bank_transfer", status=PaymentStatusEnum.paid.value, uploaded_at=now - timedelta(days=2), verified_at=now - timedelta(days=2))
        db.add(pay2)

        # Order 3: pending payment
        order3 = Order(
            customer_id=customer.id,
            total_price=670.0,
            shipping_cost=50.0,
            grand_total=720.0,
            shipping_address="789 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
            order_status=OrderStatusEnum.pending_payment.value,
            created_at=now - timedelta(hours=2),
        )
        db.add(order3)
        db.flush()
        oi3a = OrderItem(order_id=order3.id, product_id=products[9].id, seller_id=seller1.id, unit_price=180.0, quantity=2, subtotal=360.0)
        oi3b = OrderItem(order_id=order3.id, product_id=products[10].id, seller_id=seller1.id, unit_price=280.0, quantity=1, subtotal=280.0)
        db.add_all([oi3a, oi3b])

        # Order 4: another completed order by customer2
        order4 = Order(
            customer_id=customer2.id,
            total_price=490.0,
            shipping_cost=50.0,
            grand_total=540.0,
            shipping_address="321 ม.3 ต.หัวหิน อ.หัวหิน จ.ประจวบคีรีขันธ์ 77110",
            order_status=OrderStatusEnum.completed.value,
            created_at=now - timedelta(days=7),
        )
        db.add(order4)
        db.flush()
        oi4 = OrderItem(order_id=order4.id, product_id=products[6].id, seller_id=seller2.id, unit_price=490.0, quantity=1, subtotal=490.0)
        db.add(oi4)
        pay4 = Payment(order_id=order4.id, amount=540.0, payment_method="bank_transfer", status=PaymentStatusEnum.paid.value, uploaded_at=now - timedelta(days=6), verified_at=now - timedelta(days=6))
        db.add(pay4)

        db.commit()
        print("Created 4 orders with items and payments")

        # ============================
        # 6. REVIEWS
        # ============================
        reviews_data = [
            Review(product_id=products[0].id, customer_id=customer.id, order_id=order1.id, rating=5, comment="ผ้าย้อมครามสวยมากค่ะ สีเข้มสม่ำเสมอ นุ่มมาก สมราคา ❤️"),
            Review(product_id=products[2].id, customer_id=customer.id, order_id=order1.id, rating=5, comment="เซรามิกสวยมาก ลายรานธรรมชาติงดงาม บรรจุภัณฑ์ดีมาก ไม่แตกเลย"),
            Review(product_id=products[4].id, customer_id=customer.id, order_id=order2.id, rating=4, comment="เสื้อม่อฮ่อมสวย ตัดเย็บดี แต่ไซส์ใหญ่กว่าที่คาดนิดนึงค่ะ"),
            Review(product_id=products[6].id, customer_id=customer2.id, order_id=order4.id, rating=5, comment="กระเป๋ากระจูดสวยมาก ใช้ได้ทุกวัน ทนทานจริงๆ 🥰"),
        ]
        db.add_all(reviews_data)
        db.commit()
        print(f"Created {len(reviews_data)} reviews")

        print("\nDatabase seeded successfully!")
        print("Demo accounts:")
        print("  Customer: customer@otop.th / customer123")
        print("  Seller:   seller@otop.th / seller123")
        print("  Admin:    admin@otop.th / admin123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
