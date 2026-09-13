package tw.edu.ntu.coursecalendar.reminder

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import tw.edu.ntu.coursecalendar.MainActivity

class ClassReminderReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "ntu_class_reminders"
        const val EXTRA_COURSE_NAME = "extra_course_name"
        const val EXTRA_LOCATION = "extra_location"
        const val EXTRA_TIME = "extra_time"
        const val EXTRA_MINUTES = "extra_minutes"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val courseName = intent.getStringExtra(EXTRA_COURSE_NAME) ?: return
        val location = intent.getStringExtra(EXTRA_LOCATION) ?: ""
        val timeStr = intent.getStringExtra(EXTRA_TIME) ?: ""
        val minutes = intent.getIntExtra(EXTRA_MINUTES, 10)

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Android 8.0+ NotificationChannel
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "上課提醒 (Class Reminders)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "在課堂開始前發送提醒通知"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // 點擊通知開啟 App 並聚焦該課程
        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(MainActivity.EXTRA_HIGHLIGHT_COURSE, courseName)
        }
        val tapPendingIntent = PendingIntent.getActivity(
            context,
            courseName.hashCode(),
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val locText = if (location.isNotBlank()) " · 教室：$location" else ""
        val timeText = if (timeStr.isNotBlank()) " ($timeStr)" else ""

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("⏰ 還有 $minutes 分鐘上課！")
            .setContentText("$courseName$locText$timeText")
            .setStyle(NotificationCompat.BigTextStyle().bigText("$courseName\n地點：${if (location.isNotBlank()) location else "未排定"}\n時間：$timeStr"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(tapPendingIntent)
            .build()

        notificationManager.notify(courseName.hashCode(), notification)
    }
}
