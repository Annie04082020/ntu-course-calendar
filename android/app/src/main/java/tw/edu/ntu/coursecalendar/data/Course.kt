package tw.edu.ntu.coursecalendar.data

data class Course(
    val name: String,
    val nameEn: String? = null,
    val instructor: String? = null,
    val instructorEn: String? = null,
    val locations: List<String>? = null,
    val timeSlots: List<String>? = null,
    val isEnrolled: Boolean = true,
    val url: String? = null,
    val description: String? = null,
    val descriptionEn: String? = null,
    val remarks: String? = null,
    val remarksEn: String? = null
) {
    fun getDisplayName(isEnglish: Boolean = false): String {
        return if (isEnglish && !nameEn.isNullOrBlank()) nameEn else name
    }

    fun getDisplayInstructor(isEnglish: Boolean = false): String? {
        return if (isEnglish && !instructorEn.isNullOrBlank()) instructorEn else instructor
    }
}

data class PeriodDef(
    val period: String,
    val time: String,
    val end: String,
    val startMin: Int,
    val endMin: Int
)

object NTUPeriods {
    val ORDER = listOf("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "A", "B", "C", "D")

    val DEFS = mapOf(
        "0" to PeriodDef("0", "07:10", "08:00", 7 * 60 + 10, 8 * 60),
        "1" to PeriodDef("1", "08:10", "09:00", 8 * 60 + 10, 9 * 60),
        "2" to PeriodDef("2", "09:10", "10:00", 9 * 60 + 10, 10 * 60),
        "3" to PeriodDef("3", "10:20", "11:10", 10 * 60 + 20, 11 * 60 + 10),
        "4" to PeriodDef("4", "11:20", "12:10", 11 * 60 + 20, 12 * 60 + 10),
        "5" to PeriodDef("5", "12:20", "13:10", 12 * 60 + 20, 13 * 60 + 10),
        "6" to PeriodDef("6", "13:20", "14:10", 13 * 60 + 20, 14 * 60 + 10),
        "7" to PeriodDef("7", "14:20", "15:10", 14 * 60 + 20, 15 * 60 + 10),
        "8" to PeriodDef("8", "15:30", "16:20", 15 * 60 + 30, 16 * 60 + 20),
        "9" to PeriodDef("9", "16:30", "17:20", 16 * 60 + 30, 17 * 60 + 20),
        "10" to PeriodDef("10", "17:30", "18:20", 17 * 60 + 30, 18 * 60 + 20),
        "A" to PeriodDef("A", "18:25", "19:15", 18 * 60 + 25, 19 * 60 + 15),
        "B" to PeriodDef("B", "19:20", "20:10", 19 * 60 + 20, 20 * 60 + 10),
        "C" to PeriodDef("C", "20:15", "21:05", 20 * 60 + 15, 21 * 60 + 5),
        "D" to PeriodDef("D", "21:10", "22:00", 21 * 60 + 10, 22 * 60)
    )

    val WEEKDAYS_EN = mapOf(
        "一" to "MON",
        "二" to "TUE",
        "三" to "WED",
        "四" to "THU",
        "五" to "FRI",
        "六" to "SAT",
        "日" to "SUN"
    )
}

data class ScheduledCourse(
    val course: Course,
    val weekday: String,
    val periods: List<String>,
    val firstPeriod: String,
    val lastPeriod: String,
    val startMin: Int,
    val endMin: Int,
    val startTimeText: String,
    val endTimeText: String,
    val location: String
)

object CourseParser {
    fun parseSlotGroups(slotStr: String?): List<Pair<String, List<String>>> {
        if (slotStr.isNullOrBlank()) return emptyList()
        val clean = slotStr.replace("\\s+".toRegex(), "")
        val match = "^([一二三四五六日])([\\d,ABCDabcd]+)$".toRegex().find(clean) ?: return emptyList()
        val weekday = match.groupValues[1]
        val periodPart = match.groupValues[2]

        val periodList = if (periodPart.contains(',')) {
            periodPart.split(',').map { it.trim().uppercase() }.filter { it.isNotEmpty() }
        } else {
            val tokens = mutableListOf<String>()
            val regex = "(10|[0-9A-Za-z])".toRegex()
            regex.findAll(periodPart).forEach { tokens.add(it.value.uppercase()) }
            tokens
        }.map { it.replace("^0+([1-9])".toRegex(), "$1") }

        val groups = mutableListOf<List<String>>()
        var currentGroup = mutableListOf<String>()

        for (p in periodList) {
            val pIdx = NTUPeriods.ORDER.indexOf(p)
            if (pIdx == -1) continue
            if (currentGroup.isEmpty()) {
                currentGroup.add(p)
            } else {
                val lastIdx = NTUPeriods.ORDER.indexOf(currentGroup.last())
                if (pIdx - lastIdx == 1) {
                    currentGroup.add(p)
                } else {
                    groups.add(currentGroup.toList())
                    currentGroup = mutableListOf(p)
                }
            }
        }
        if (currentGroup.isNotEmpty()) groups.add(currentGroup.toList())

        return groups.map { weekday to it }
    }

    fun buildWeekSchedule(courses: List<Course>): Map<String, List<ScheduledCourse>> {
        val schedule = mutableMapOf<String, MutableList<ScheduledCourse>>()
        listOf("一", "二", "三", "四", "五", "六", "日").forEach {
            schedule[it] = mutableListOf()
        }

        courses.forEach { course ->
            course.timeSlots?.forEach { slotStr ->
                val groups = parseSlotGroups(slotStr)
                groups.forEach { (weekday, periods) ->
                    val first = periods.firstOrNull() ?: return@forEach
                    val last = periods.lastOrNull() ?: return@forEach
                    val startDef = NTUPeriods.DEFS[first] ?: return@forEach
                    val endDef = NTUPeriods.DEFS[last] ?: return@forEach
                    val loc = course.locations?.joinToString("、") ?: "依系所公告"

                    schedule[weekday]?.add(
                        ScheduledCourse(
                            course = course,
                            weekday = weekday,
                            periods = periods,
                            firstPeriod = first,
                            lastPeriod = last,
                            startMin = startDef.startMin,
                            endMin = endDef.endMin,
                            startTimeText = startDef.time,
                            endTimeText = endDef.end,
                            location = loc
                        )
                    )
                }
            }
        }

        schedule.keys.forEach { day ->
            schedule[day]?.sortBy { it.startMin }
        }

        return schedule
    }
}
