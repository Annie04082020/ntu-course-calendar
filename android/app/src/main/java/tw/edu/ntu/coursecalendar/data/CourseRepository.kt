package tw.edu.ntu.coursecalendar.data

import android.content.Context
import androidx.glance.appwidget.updateAll
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import tw.edu.ntu.coursecalendar.widget.TimetableGlanceWidget
import tw.edu.ntu.coursecalendar.widget.TodayGlanceWidget

class CourseRepository(private val context: Context) {
    private val prefs = context.getSharedPreferences("ntu_course_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()
    private val keyCourses = "saved_courses_json"

    // 示範課程 (含中英雙語官方資訊)
    val demoCourses: List<Course> = listOf(
        Course(
            name = "微積分甲 (一)",
            nameEn = "Calculus (1)",
            instructor = "齊震宇",
            instructorEn = "Zhen-Yu Qi",
            locations = listOf("共同101"),
            timeSlots = listOf("一 3,4", "三 3,4"),
            isEnrolled = true
        ),
        Course(
            name = "普通物理學甲 (一)",
            nameEn = "General Physics (1)",
            instructor = "張寶棣",
            instructorEn = "Pao-Ti Chang",
            locations = listOf("普物館102"),
            timeSlots = listOf("二 2,3,4"),
            isEnrolled = true
        ),
        Course(
            name = "計算機程式設計",
            nameEn = "Computer Programming",
            instructor = "鄭卜壬",
            instructorEn = "Pu-Jen Cheng",
            locations = listOf("資101"),
            timeSlots = listOf("四 6,7,8"),
            isEnrolled = true
        ),
        Course(
            name = "資料結構與演算法",
            nameEn = "Data Structures and Algorithms",
            instructor = "呂學一",
            instructorEn = "Hsueh-I Lu",
            locations = listOf("博理101"),
            timeSlots = listOf("五 2,3,4"),
            isEnrolled = true
        ),
        Course(
            name = "機器學習",
            nameEn = "Machine Learning",
            instructor = "李宏毅",
            instructorEn = "Hung-yi Lee",
            locations = listOf("電二143"),
            timeSlots = listOf("一 7,8,9"),
            isEnrolled = true
        )
    )

    fun getLanguage(): String {
        return prefs.getString("display_language", "system") ?: "system"
    }

    fun setLanguage(lang: String) {
        prefs.edit().putString("display_language", lang).apply()
        triggerWidgetUpdate()
    }

    fun isEnglish(): Boolean {
        val lang = getLanguage()
        if (lang == "en") return true
        if (lang == "zh") return false
        val locale = java.util.Locale.getDefault()
        return locale.language.startsWith("en")
    }

    fun getCourses(): List<Course> {
        val json = prefs.getString(keyCourses, null) ?: return demoCourses
        return try {
            val type = object : TypeToken<List<Course>>() {}.type
            gson.fromJson<List<Course>>(json, type) ?: demoCourses
        } catch (e: Exception) {
            demoCourses
        }
    }

    fun isUsingDemo(): Boolean {
        return prefs.getString(keyCourses, null) == null
    }

    private val keyReminderMinutes = "reminder_minutes_before"

    fun getReminderMinutes(): Int {
        return prefs.getInt(keyReminderMinutes, 10) // 預設 10 分鐘前提醒
    }

    fun setReminderMinutes(minutes: Int) {
        prefs.edit().putInt(keyReminderMinutes, minutes).apply()
        tw.edu.ntu.coursecalendar.reminder.ClassReminderManager.scheduleAllReminders(context)
    }

    fun saveCourses(courses: List<Course>) {
        val json = gson.toJson(courses)
        prefs.edit().putString(keyCourses, json).apply()
        triggerWidgetUpdate()
        tw.edu.ntu.coursecalendar.reminder.ClassReminderManager.scheduleAllReminders(context)
    }

    fun saveCoursesFromJson(json: String): Boolean {
        return try {
            val type = object : TypeToken<List<Course>>() {}.type
            val parsed = gson.fromJson<List<Course>>(json.trim(), type)
            if (parsed.isNullOrEmpty()) return false
            prefs.edit().putString(keyCourses, gson.toJson(parsed)).apply()
            triggerWidgetUpdate()
            tw.edu.ntu.coursecalendar.reminder.ClassReminderManager.scheduleAllReminders(context)
            true
        } catch (e: Exception) {
            false
        }
    }

    fun clearUserData() {
        prefs.edit().remove(keyCourses).apply()
        triggerWidgetUpdate()
        tw.edu.ntu.coursecalendar.reminder.ClassReminderManager.cancelAllReminders(context)
    }

    fun triggerWidgetUpdate() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                TimetableGlanceWidget().updateAll(context)
                TodayGlanceWidget().updateAll(context)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}

