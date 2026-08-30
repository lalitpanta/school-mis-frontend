import re

file_path = "d:/Desktop/mis/frontend/src/components/settings/ResultManagementModule.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_pattern = r'\{moduleType === "marks" && \(\s*<div className="space-y-6">\s*<div className="grid grid-cols-1 md:grid-cols-4 gap-4">'

match = re.search(start_pattern, content)
if not match:
    print("Start pattern not found!")
    exit(1)

start_idx = match.start()

end_pattern = r'</SettingsModal>'
end_match = re.search(r'      </div>\s*<SettingsModal\s*open=\{showFormatModal\}', content[start_idx:])
if not end_match:
    print("End pattern not found!")
    exit(1)

end_idx = start_idx + end_match.start()

new_marks_block = """{moduleType === "marks" && (
        <div className="space-y-6 text-sm">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold mr-auto">
              Academic Year 2025-26
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 font-medium text-xs transition">
              <Upload size={14} /> Import CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 font-medium text-xs transition">
              <Download size={14} /> Export CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 font-medium text-xs transition">
              <FileText size={14} /> Download PDF
            </button>
          </div>

          {/* Filters Area */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                CLASS
              </label>
              <select
                value={marksClassId}
                onChange={(e) => handleMarksClassChange(e.target.value)}
                className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                SECTION
              </label>
              <select
                value={marksSectionId}
                onChange={(e) => handleMarksSectionChange(e.target.value)}
                disabled={!marksClassId}
                className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">
                  {marksClassId ? "-- Select Section --" : "Choose Class"}
                </option>
                {marksSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name || sec.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                EXAM
              </label>
              <select
                value={selectedExamForMarks?.id || ""}
                onChange={(e) => {
                  const exam = examFormats.find(
                    (f) => f.id === parseInt(e.target.value),
                  );
                  if (exam) handleSelectExamForMarks(exam);
                  else handleSelectExamForMarks(null);
                }}
                className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose Exam --</option>
                {examFormats.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.exam_type} ({format.class_name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                SUBJECT
              </label>
              <select
                value={selectedSubjectForMarks?.id || ""}
                onChange={(e) => {
                  const subject = examSubjects.find(
                    (s) => s.id === parseInt(e.target.value),
                  );
                  if (subject) handleSelectSubjectForMarks(subject);
                  else handleSelectSubjectForMarks(null);
                }}
                disabled={!selectedExamForMarks}
                className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="">
                  {selectedExamForMarks ? "-- Choose Subject --" : "Choose Exam"}
                </option>
                {examSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                STATUS FILTER
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="All students">All students</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {selectedSubjectForMarks && marksClassId && (
            <>
              {/* Summary Cards */}
              {(() => {
                let passed = 0;
                let failed = 0;
                let totalPercent = 0;
                const validStudents = students.filter(s => marksData[s.id] && (marksData[s.id].theory_marks !== "" || marksData[s.id].practical_marks !== ""));
                
                validStudents.forEach((s) => {
                  if (marksData[s.id].is_pass) passed++;
                  else failed++;
                  const maxMarks = parseFloat(selectedSubjectForMarks?.total_max_marks) || 100;
                  const totalMarks = parseFloat(marksData[s.id].total_marks) || 0;
                  const percent = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
                  totalPercent += percent;
                });
                
                const passRate = validStudents.length ? Math.round((passed / validStudents.length) * 100) : 0;
                const classAvg = validStudents.length ? Math.round(totalPercent / validStudents.length) : 0;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                      <div className="text-2xl font-black text-white">{students.length}</div>
                      <div className="text-xs font-medium text-slate-400 mt-1">Total students</div>
                    </div>
                    <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                      <div className="text-2xl font-black text-green-500">{passed}</div>
                      <div className="text-xs font-medium text-slate-400 mt-1">Passed</div>
                    </div>
                    <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                      <div className="text-2xl font-black text-red-500">{failed}</div>
                      <div className="text-xs font-medium text-slate-400 mt-1">Failed</div>
                    </div>
                    <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                      <div className="text-2xl font-black text-white">{passRate}%</div>
                      <div className="text-xs font-medium text-slate-400 mt-1">Pass rate</div>
                    </div>
                    <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                      <div className="text-2xl font-black text-white">{classAvg}%</div>
                      <div className="text-xs font-medium text-slate-400 mt-1">Class average</div>
                    </div>
                  </div>
                );
              })()}

              {/* Toolbar: Search and Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1e2430] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveAllMarks}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-600 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
                  >
                    <Check size={16} /> {loading ? "Saving..." : "Save all marks"}
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 border border-slate-600 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition"
                  >
                    <Plus size={16} /> Add student
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-700/60 rounded-xl mt-4 bg-[#141a23]">
                <div className="flex items-center justify-between p-4 bg-slate-800/40 border-b border-slate-700/60 text-slate-300">
                  <div className="font-bold">{students.length} students</div>
                  <div className="text-xs">
                    Pass mark: {selectedExamForMarks?.pass_mark_percentage || 40} | Full marks: Theory {selectedSubjectForMarks.theory_max_marks || 0} + Practical {selectedSubjectForMarks.practical_max_marks || 0} = {selectedSubjectForMarks.total_max_marks || 0}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-[#141a23] border-b border-slate-700/60">
                    <tr>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-24">ROLL NO</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400">STUDENT NAME</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-28">THEORY /{selectedSubjectForMarks.theory_max_marks || 0}</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-28">PRACTICAL /{selectedSubjectForMarks.practical_max_marks || 0}</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-20">TOTAL</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-16">%</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-16">GRADE</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-32">REMARKS</th>
                      <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-400 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.filter(s => {
                      const searchLower = searchQuery.toLowerCase();
                      const matchesSearch = s.full_name.toLowerCase().includes(searchLower) || (s.roll_no && s.roll_no.toString().toLowerCase().includes(searchLower));
                      
                      if (statusFilter === "All students") return matchesSearch;
                      const mark = marksData[s.id];
                      if (!mark || (mark.theory_marks === "" && mark.practical_marks === "")) return false;
                      
                      if (statusFilter === "Passed") return matchesSearch && mark.is_pass;
                      if (statusFilter === "Failed") return matchesSearch && !mark.is_pass;
                      return matchesSearch;
                    }).map((student) => {
                      const mark = marksData[student.id];
                      if (!mark) return null;

                      const hasMarks = mark.theory_marks !== "" || mark.practical_marks !== "";
                      const maxMarks = parseFloat(selectedSubjectForMarks?.total_max_marks) || 100;
                      const totalMarks = parseFloat(mark.total_marks) || 0;
                      const percent = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
                      
                      const getGradeInfo = (pct, isPass, hasData) => {
                        if (!hasData) return { grade: "-", color: "text-slate-500", bg: "bg-slate-800" };
                        if (!isPass) return { grade: "F", color: "text-blue-400", bg: "bg-blue-400/20" };
                        if (pct >= 90) return { grade: "A+", color: "text-blue-400", bg: "bg-blue-400/20" };
                        if (pct >= 80) return { grade: "A", color: "text-blue-400", bg: "bg-blue-400/20" };
                        if (pct >= 70) return { grade: "B+", color: "text-blue-400", bg: "bg-blue-400/20" };
                        if (pct >= 60) return { grade: "B", color: "text-blue-400", bg: "bg-blue-400/20" };
                        if (pct >= 50) return { grade: "C+", color: "text-blue-400", bg: "bg-blue-400/20" };
                        if (pct >= 40) return { grade: "C", color: "text-blue-400", bg: "bg-blue-400/20" };
                        return { grade: "D", color: "text-blue-400", bg: "bg-blue-400/20" };
                      };

                      const gradeInfo = getGradeInfo(percent, mark.is_pass, hasMarks);

                      return (
                        <tr key={student.id} className="hover:bg-slate-800/30 transition text-white font-medium">
                          <td className="px-4 py-4">{student.roll_no}</td>
                          <td className="px-4 py-4">{student.full_name}</td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              className="w-16 bg-[#1e2430] border border-slate-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 text-center"
                              value={mark.theory_marks}
                              onChange={(e) =>
                                handleMarkChange(
                                  student.id,
                                  "theory_marks",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              className="w-16 bg-[#1e2430] border border-slate-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 text-center"
                              value={mark.practical_marks}
                              onChange={(e) =>
                                handleMarkChange(
                                  student.id,
                                  "practical_marks",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-4 py-4">{hasMarks ? mark.total_marks : "-"}</td>
                          <td className="px-4 py-4">{hasMarks ? `${Math.round(percent)}%` : "-"}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${gradeInfo.bg} ${gradeInfo.color}`}>
                              {gradeInfo.grade}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              className="w-full bg-[#1e2430] border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                              value={mark.remarks}
                              placeholder="Add re"
                              onChange={(e) =>
                                handleMarkChange(
                                  student.id,
                                  "remarks",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {hasMarks && (
                                <span
                                  className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                    mark.is_pass
                                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                                      : "bg-red-500/10 text-red-500 border-red-500/20"
                                  }`}
                                >
                                  {mark.is_pass ? "Pass" : "Fail"}
                                </span>
                              )}
                              <button className="w-8 h-8 flex items-center justify-center border border-red-900/30 bg-red-900/20 hover:bg-red-900/40 rounded transition">
                                <Edit2 size={12} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}"""

new_content = content[:start_idx] + new_marks_block + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replaced content successfully.")
