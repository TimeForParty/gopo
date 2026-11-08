const admin = require('firebase-admin');

// Инициализация Firebase Admin через переменную окружения
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase admin init error:', error);
  }
}

module.exports = async (req, res) => {
  // Разрешаем только POST-запросы
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { recipientId, senderName, type, text } = req.body;
  if (!recipientId) return res.status(400).send('No recipientId');

  try {
    // 1. Получаем токены пользователя из Firestore
    const userDoc = await admin.firestore().collection('users').doc(recipientId).get();
    if (!userDoc.exists) return res.status(404).send('User not found');

    const userData = userDoc.data();
    const tokens = userData.fcmTokens || [];
    if (tokens.length === 0) return res.status(200).send('No tokens');

    // 2. Формируем текст уведомления
    let body = 'Новое уведомление в GoPo';
    if (type === 'resonance') body = `@${senderName} резонировал(а) с твоим пузырём`;
    if (type === 'comment') body = `@${senderName} прокомментировал(а) твой пузырь`;
    if (type === 'follow') body = `@${senderName} подписался(-ась) на тебя`;
    if (type === 'message') body = `@${senderName}: ${text || 'новое сообщение'}`;

    // 3. Отправляем пуш
    const message = {
      tokens: tokens,
      notification: { title: "GoPo ❄️", body: body },
      webpush: {
        notification: { icon: "/icon-192.png", badge: "/icon-192.png" },
        fcmOptions: { link: "/" }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // 4. Удаляем битые токены (если пользователь переустановил браузер)
    const tokensToRemove = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && (resp.error.code === 'messaging/invalid-registration-token' || resp.error.code === 'messaging/registration-token-not-registered')) {
        tokensToRemove.push(tokens[idx]);
      }
    });

    if (tokensToRemove.length > 0) {
      await admin.firestore().collection('users').doc(recipientId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
      });
    }

    res.status(200).json({ success: true, sent: response.successCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
