const cron = require('node-cron');
const Event = require('./models/Event');
const { deleteFolder } = require('./services/storageService');

// Temizlik fonksiyonunu asenkron olarak tanımla
const runCleanupTask = async () => {
    console.log('🕒 [Cleanup Task] Starting expired files cleanup job...');

    try {
        // 1. Süresi bitmiş ve henüz dosyaları silinmemiş etkinlikleri bul
        // GÜVENLİK: Şu anki saatten 1 saat öncesini baz al (Buffer time)
        // storageExpiresAt < (NOW - 1 hour)
        const thresholdDate = new Date(Date.now() - 60 * 60 * 1000);

        const expiredEvents = await Event.find({
            storageExpiresAt: { $lt: thresholdDate },
            isFilesDeleted: { $ne: true }, // false veya undefined
            storagePrefix: { $exists: true, $ne: "" } // Path olduğundan emin ol
        });

        console.log(`[Cleanup Task] Found ${expiredEvents.length} events with expired storage.`);

        if (expiredEvents.length === 0) {
            console.log('✅ [Cleanup Task] No files to clean up.');
            return { success: true, message: "No files to clean up", cleanedCount: 0 };
        }

        // 2. Her etkinlik için dosyaları sil
        let successCount = 0;
        let failCount = 0;

        for (const event of expiredEvents) {
            try {
                console.log(`[Cleanup Task] Processing Event ID: ${event._id}, Prefix: ${event.storagePrefix}`);
                
                // Storage'dan sil
                await deleteFolder(event.storagePrefix);

                // DB'de işaretle
                event.isFilesDeleted = true;
                await event.save();

                successCount++;
            } catch (err) {
                console.error(`❌ [Cleanup Task] Error cleaning event ${event._id}:`, err.message);
                failCount++;
            }
        }

        const resultBase = `Cleanup finished. Success: ${successCount}, Failed: ${failCount}`;
        console.log(`✅ [Cleanup Task] ${resultBase}`);
        return { success: true, message: resultBase, cleanedCount: successCount, failedCount: failCount };

    } catch (error) {
        console.error('❌ [Cleanup Task] Fatal error in cleanup job:', error);
        return { success: false, error: error.message };
    }
};

// Cron Job: Her gün gece 04:00'te çalışır (Sunucu açıksa)
// 0 4 * * * -> 04:00
const cronTask = cron.schedule('0 4 * * *', runCleanupTask);

module.exports = {
    cleanExpiredFiles: cronTask,
    runCleanupTask // Manuel tetikleme için dışa açtık
};
