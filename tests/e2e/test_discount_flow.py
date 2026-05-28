from urllib.parse import quote

from playwright.sync_api import expect


def test_storefront_discount_ui(page, base_url):
    tenant_id = "test-tenant"
    cart_items = [
        {
            "id": "product-1",
            "product_id": "product-1",
            "variant_id": None,
            "variant_name": None,
            "category_id": "cat-1",
            "sku_code": "SKU-1",
            "product_name": "Test Ürün 1",
            "description": None,
            "image_url": None,
            "is_in_stock": True,
            "currency": "USD",
            "price": 450,
            "package_quantity": None,
            "carton_quantity": None,
            "stock_quantity": None,
            "quantity": 2,
        },
        {
            "id": "product-2",
            "product_id": "product-2",
            "variant_id": None,
            "variant_name": None,
            "category_id": "cat-1",
            "sku_code": "SKU-2",
            "product_name": "Test Ürün 2",
            "description": None,
            "image_url": None,
            "is_in_stock": True,
            "currency": "USD",
            "price": 150,
            "package_quantity": None,
            "carton_quantity": None,
            "stock_quantity": None,
            "quantity": 1,
        },
    ]

    page.add_init_script(
        """
        window.localStorage.setItem(arguments[0], arguments[1]);
        """,
        f"ekatalox_cart_{tenant_id}",
        __import__("json").dumps(cart_items),
    )

    page.goto(f"{base_url}/store/demo")

    discount_copy = page.get_by_text("Tebrikler! %10 İskonto Kazandınız! 🎉")
    expect(discount_copy).to_be_visible()

    page.get_by_role("button", name="Sepetim").click()
    expect(page.get_by_text("İskonto (%10)")).to_be_visible()
    expect(page.get_by_text("Genel Toplam")).to_be_visible()


def test_whatsapp_message_discount_lines(page, base_url):
    tenant_id = "test-tenant"
    cart_items = [
        {
            "id": "product-1",
            "product_id": "product-1",
            "variant_id": None,
            "variant_name": None,
            "category_id": "cat-1",
            "sku_code": "SKU-1",
            "product_name": "Test Ürün 1",
            "description": None,
            "image_url": None,
            "is_in_stock": True,
            "currency": "USD",
            "price": 1050,
            "package_quantity": None,
            "carton_quantity": None,
            "stock_quantity": None,
            "quantity": 1,
        }
    ]

    page.add_init_script(
        """
        window.localStorage.setItem(arguments[0], arguments[1]);
        """,
        f"ekatalox_cart_{tenant_id}",
        __import__("json").dumps(cart_items),
    )

    page.goto(f"{base_url}/store/demo")
    whatsapp_link = page.get_by_role("link", name="WhatsApp ile Siparişi Tamamla")
    href = whatsapp_link.get_attribute("href")
    assert href is not None
    decoded = __import__("urllib.parse").parse_qs(__import__("urllib.parse").urlparse(href).query)["text"][0]
    assert "Ara Toplam: 1050.00 $" in decoded
    assert "İskonto (%10): -105.00 $" in decoded
    assert "Genel Toplam: 945.00 $" in decoded
