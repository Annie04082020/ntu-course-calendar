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

    // 示範課程
    val demoCourses: List<Course> = listOf(
        Course(
            name = "微積分甲 (一)",
            instructor = "齊震宇",
            locations = listOf("共同101"),
            timeSlots = listOf("一 3,4", "三 3,4"),
            isEnrolled = true
        ),
        Course(
            name = "普通物理學甲 (一)",
            instructor = "張寶棣",
            locations = listOf("普物館102"),
            timeSlots = listOf("二 2,3,4"),
            isEnrolled = true
        ),
        Course(
            name = "計算機程式設計",
            instructor = "鄭卜壬",
            locations = listOf("資101"),
            timeSlots = listOf("四 6,7,8"),
            isEnrolled = true
        ),
        Course(
            name = "資料結構與演算法",
            instructor = "呂學一",
            locations = listOf("博理101"),
            timeSlots = listOf("五 2,3,4"),
            isEnrolled = true
        ),
        Course(
            name = "機器學習",
            instructor = "李宏毅",
            locations = listOf("電二143"),
            timeSlots = listOf("一 7,8,9"),
            isEnrolled = true
        )
    )

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

    fun saveCourses(courses: List<Course>) {
        val json = gson.toJson(courses)
        prefs.edit().putString(keyCourses, json).apply()
        triggerWidgetUpdate()
    }

    fun saveCoursesFromJson(json: String): Boolean {
        return try {
            val type = object : TypeToken<List<Course>>() {}.type
            val parsed = gson.fromJson<List<Course>>(json.trim(), type)
            if (parsed.isNullOrEmpty()) return false
            prefs.edit().putString(keyCourses, gson.toJson(parsed)).apply()
            triggerWidgetUpdate()
            true
        } catch (e: Exception) {
            false
        }
    }

    fun clearUserData() {
        prefs.edit().remove(keyCourses).apply()
        triggerWidgetUpdate()
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
