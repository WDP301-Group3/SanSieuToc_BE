# Hướng dẫn cấu hình Email cho Reset Password

## Bước 1: Tạo App Password cho Gmail

1. Đăng nhập vào tài khoản Gmail của bạn
2. Truy cập: https://myaccount.google.com/security
3. Bật **2-Step Verification** (nếu chưa bật):
   - Tìm mục "2-Step Verification"
   - Click "Get Started" và làm theo hướng dẫn

4. Sau khi bật 2-Step Verification, tạo **App Password**:
   - Truy cập: https://myaccount.google.com/apppasswords
   - Hoặc tìm "App passwords" trong phần Security
   - Chọn app: "Mail"
   - Chọn device: "Windows Computer" (hoặc bất kỳ)
   - Click "Generate"
   - **Copy mật khẩu 16 ký tự** được tạo ra (không có khoảng trắng)

## Bước 2: Cập nhật file .env

Mở file `.env` và thay đổi:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

Thành:

```env
EMAIL_USER=email-cua-ban@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

**Lưu ý:** 
- `EMAIL_USER`: Email Gmail thật của bạn
- `EMAIL_PASSWORD`: Mật khẩu 16 ký tự vừa tạo ở bước 1 (App Password)

## Bước 3: Restart Server

Sau khi cập nhật `.env`, restart lại server:

```bash
# Dừng server hiện tại (Ctrl + C)
# Khởi động lại
npm start
```

## Test Email

Sau khi cấu hình, test API reset-password:

```http
POST http://localhost:9999/api/customer/auth/reset-password
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

Nếu cấu hình đúng, bạn sẽ nhận được email với mật khẩu mới.

## Troubleshooting

### Vẫn báo lỗi "Invalid login"?
- Kiểm tra lại EMAIL_USER có đúng định dạng email không
- Kiểm tra lại EMAIL_PASSWORD có đúng App Password (16 ký tự) không
- Đảm bảo đã bật 2-Step Verification
- Thử tạo lại App Password mới

### Không nhận được email?
- Kiểm tra folder Spam/Junk
- Kiểm tra email có tồn tại trong database không
- Xem console log có thông báo gì không

### Chưa muốn cấu hình email?
App vẫn hoạt động bình thường! Khi reset password:
- Mật khẩu mới vẫn được tạo và lưu vào database
- Mật khẩu sẽ được trả về trong response thay vì gửi email
- Console log sẽ hiển thị thông báo và mật khẩu mới

## Alternative: Sử dụng Email Service khác

Nếu không muốn dùng Gmail, có thể dùng:
- **Mailtrap** (cho development): https://mailtrap.io
- **SendGrid**: https://sendgrid.com
- **Mailgun**: https://www.mailgun.com

Cần thay đổi config trong file `utils/emailConfig.js`
