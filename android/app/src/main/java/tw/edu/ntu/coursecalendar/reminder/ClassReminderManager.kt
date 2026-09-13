package tw.edu.ntu.coursecalendar.reminder

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import tw.edu.ntu.coursecalendar.data.CourseParser
import tw.edu.ntu.coursecalendar.data.CourseRepository
import java.util.*

object ClassReminderManager {

    private const val MAX_ALARMS = 100

    fun scheduleAllReminders(context: Context) {
        cancelAllReminders(context)

        val repo = CourseRepository(context)
        val minutesBefore = repo.getReminderMinutes()
        if (minutesBefore <= 0) return

        val courses = repo.getCourses()
        val weekSchedule = CourseParser.buildWeekSchedule(courses)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val nowCalendar = Calendar.getInstance()
        var requestCode = 1000

        // 遍歷未來 7 天
        for (dayOffset in 0..6) {
            val targetCalendar = (nowCalendar.clone() as Calendar).apply {
                add(Calendar.DAY_OF_YEAR, dayOffset)
            }
            val targetWeekday = when (targetCalendar.get(Calendar.DAY_OF_WEEK)) {
                Calendar.MONDAY -> "一"
                Calendar.TUESDAY -> "二"
                Calendar.WEDNESDAY -> "三"
                Calendar.THURSDAY -> "四"
                Calendar.FRIDAY -> "五"
                Calendar.SATURDAY -> "六"
                else -> "日"
            }

            val todayScheduledCourses = weekSchedule[targetWeekday] ?: emptyList()

            for (c in todayScheduledCourses) {
                val classTime = (targetCalendar.clone() as Calendar).apply {
                    set(Calendar.HOUR_OF_DAY, c.startMin / 60)
                    set(Calendar.MINUTE, c.startMin % 60)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }

                // 扣除提醒分鐘數
                val reminderTime = (classTime.clone() as Calendar).apply {
                    add(Calendar.MINUTE, -minutesBefore)
                }

                // 只排定未來的鬧鐘
                if (reminderTime.timeInMillis > System.currentTimeMillis()) {
                    val intent = Intent(context, ClassReminderReceiver::class.java).apply {
                        putExtra(ClassReminderReceiver.EXTRA_COURSE_NAME, c.course.name)
                        putExtra(ClassReminderReceiver.EXTRA_LOCATION, c.location)
                        putExtra(ClassReminderReceiver.EXTRA_TIME, "${c.startTimeText}-${c.endTimeText}")
                        putExtra(ClassReminderReceiver.EXTRA_MINUTES, minutesBefore)
                    }

                    val pendingIntent = PendingIntent.getBroadcast(
                        context,
                        requestCode++,
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )

                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            alarmManager.setExactAndAllowWhileIdle(
                                AlarmManager.RTC_WAKEUP,
                                reminderTime.timeInMillis,
                                pendingIntent
                            )
                        } else {
                            alarmManager.set(
                                AlarmManager.RTC_WAKEUP,
                                reminderTime.timeInMillis,
                                pendingIntent
                            )
                        }
                    } catch (e: SecurityException) {
                        // 缺乏精確鬧鐘權限時 fallback
                        alarmManager.set(
                            AlarmManager.RTC_WAKEUP,
                            reminderTime.timeInMillis,
                            pendingIntent
                        )
                    }

                    if (requestCode >= 1000 + MAX_ALARMS) break
                }
            }
        }
    }

    fun cancelAllReminders(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        for (code in 1000..(1000 + MAX_ALARMS)) {
            val intent = Intent(context, ClassReminderReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                code,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
        }
    }
}
