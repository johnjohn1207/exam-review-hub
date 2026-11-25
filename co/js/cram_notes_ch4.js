// Chapter 4: 單週期處理器考前精簡速背表 (Ch4 Cram Notes Module)
// 零廢話、高密度考點版：真值表、ALU 解碼、位址公式、課堂 4 題、關鍵路徑

function renderCh4CramNotes() {
  const container = document.getElementById("ch4CramNotesContainer");
  if (!container) return;

  container.innerHTML = `
    <!-- 頂部快速導覽列 -->
    <div class="card" style="border-left: 5px solid #10b981; margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <h2 style="font-size: 1.25rem; color: #34d399; margin: 0;">Chapter 4 單週期處理器・考前精簡速背表</h2>
        <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
          <a href="#ch4CramSignals" class="filter-btn" style="text-decoration: none;">1. 控制訊號表</a>
          <a href="#ch4CramAlu" class="filter-btn" style="text-decoration: none;">2. ALU 解碼</a>
          <a href="#ch4CramAddress" class="filter-btn" style="text-decoration: none;">3. 位址公式</a>
          <a href="#ch4CramExercises" class="filter-btn" style="text-decoration: none;">4. 課堂 4 題</a>
          <a href="#ch4CramCriticalPath" class="filter-btn" style="text-decoration: none;">5. 關鍵路徑</a>
          <button type="button" id="btnJumpDatapathLab" class="filter-btn" style="border-color: #facc15; color: #fde047;">前往螢光路徑大圖</button>
        </div>
      </div>
    </div>

    <!-- 1. 主控制訊號真值表 -->
    <div id="ch4CramSignals" class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3 class="card-title" style="color: var(--primary);">一、 主控制單元 9 大訊號真值表（依 Opcode [31:26] 解碼）</h3>
      </div>

      <div style="overflow-x: auto; margin-top: 0.75rem;">
        <table class="data-table" style="font-size: 0.85rem; width: 100%; text-align: center;">
          <thead>
            <tr>
              <th>指令</th><th>Opcode</th><th>RegDst</th><th>ALUSrc</th><th>MemtoReg</th><th>RegWrite</th><th>MemRead</th><th>MemWrite</th><th>Branch</th><th>ALUOp</th><th>Jump</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>R-format</strong></td><td><code>000000</code></td>
              <td><strong style="color:#38bdf8;">1</strong></td><td>0</td><td>0</td><td><strong style="color:#10b981;">1</strong></td><td>0</td><td>0</td><td>0</td><td><code>10</code></td><td>0</td>
            </tr>
            <tr>
              <td><strong>lw</strong></td><td><code>100011</code></td>
              <td>0</td><td><strong style="color:#f59e0b;">1</strong></td><td><strong style="color:#f59e0b;">1</strong></td><td><strong style="color:#10b981;">1</strong></td><td><strong style="color:#10b981;">1</strong></td><td>0</td><td>0</td><td><code>00</code></td><td>0</td>
            </tr>
            <tr>
              <td><strong>sw</strong></td><td><code>101011</code></td>
              <td><strong style="color:#94a3b8;">X</strong></td><td><strong style="color:#f59e0b;">1</strong></td><td><strong style="color:#94a3b8;">X</strong></td><td>0</td><td>0</td><td><strong style="color:#f43f5e;">1</strong></td><td>0</td><td><code>00</code></td><td>0</td>
            </tr>
            <tr>
              <td><strong>beq</strong></td><td><code>000100</code></td>
              <td><strong style="color:#94a3b8;">X</strong></td><td>0</td><td><strong style="color:#94a3b8;">X</strong></td><td>0</td><td>0</td><td>0</td><td><strong style="color:#f43f5e;">1</strong></td><td><code>01</code></td><td>0</td>
            </tr>
            <tr>
              <td><strong>addi</strong></td><td><code>001000</code></td>
              <td>0</td><td><strong style="color:#f59e0b;">1</strong></td><td>0</td><td><strong style="color:#10b981;">1</strong></td><td>0</td><td>0</td><td>0</td><td><code>00</code></td><td>0</td>
            </tr>
            <tr>
              <td><strong>j</strong></td><td><code>000010</code></td>
              <td><strong style="color:#94a3b8;">X</strong></td><td><strong style="color:#94a3b8;">X</strong></td><td><strong style="color:#94a3b8;">X</strong></td><td>0</td><td>0</td><td>0</td><td>0</td><td><code>XX</code></td><td><strong style="color:#a855f7;">1</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; margin-top: 1rem; font-size: 0.85rem;">
        <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px; border-left: 3px solid #38bdf8;">
          <strong>RegDst</strong>：<code>1</code>=rd (R-type)；<code>0</code>=rt (lw, addi)；<code>X</code>=不寫暫存器 (sw, beq, j)。
        </div>
        <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px; border-left: 3px solid #10b981;">
          <strong>ALUSrc</strong>：<code>0</code>=Read data 2 (R-type, beq)；<code>1</code>=SignExt imm (lw, sw, addi)。
        </div>
        <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px; border-left: 3px solid #f59e0b;">
          <strong>MemtoReg</strong>：<code>1</code>=D-Mem (僅 lw)；<code>0</code>=ALU Result (R-type, addi)；<code>X</code>=sw, beq, j。
        </div>
      </div>
    </div>

    <!-- 2. ALU 雙層解碼 -->
    <div id="ch4CramAlu" class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3 class="card-title" style="color: var(--primary);">二、 ALU 雙層解碼（ALUOp + Funct &rarr; 4-bit ALU Control）</h3>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-top: 0.75rem;">
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.86rem; line-height: 1.7;">
          <strong style="color: #38bdf8;">ALUOp (2-bit)</strong><br>
          • <code>00</code>：強制 add（lw / sw / addi）<br>
          • <code>01</code>：強制 subtract（beq）<br>
          • <code>10</code>：依 <code>funct [5:0]</code> 解碼（R-type）
        </div>
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem; font-family: var(--font-mono); line-height: 1.65;">
          <strong style="color: #10b981; font-family: var(--font-sans);">4-bit ALU Control</strong><br>
          <code>0000</code> AND &nbsp;|&nbsp; <code>0001</code> OR &nbsp;|&nbsp; <code>0010</code> add<br>
          <code>0110</code> sub &nbsp;|&nbsp; <code>0111</code> slt &nbsp;|&nbsp; <code>1100</code> NOR
        </div>
      </div>

      <div style="overflow-x: auto; margin-top: 0.85rem;">
        <table class="data-table" style="font-size: 0.84rem; text-align: center;">
          <thead>
            <tr><th>指令</th><th>ALUOp</th><th>Funct (Bin)</th><th>Funct (Hex)</th><th>ALU 動作</th><th>ALU Control</th></tr>
          </thead>
          <tbody>
            <tr><td>add</td><td><code>10</code></td><td><code>100000</code></td><td><code>0x20</code></td><td>add</td><td><code>0010</code></td></tr>
            <tr><td>sub</td><td><code>10</code></td><td><code>100010</code></td><td><code>0x22</code></td><td>subtract</td><td><code>0110</code></td></tr>
            <tr><td>and</td><td><code>10</code></td><td><code>100100</code></td><td><code>0x24</code></td><td>AND</td><td><code>0000</code></td></tr>
            <tr><td>or</td><td><code>10</code></td><td><code>100101</code></td><td><code>0x25</code></td><td>OR</td><td><code>0001</code></td></tr>
            <tr><td>slt</td><td><code>10</code></td><td><code>101010</code></td><td><code>0x2A</code></td><td>slt</td><td><code>0111</code></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. 位址合成公式 -->
    <div id="ch4CramAddress" class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3 class="card-title" style="color: var(--primary);">三、 Branch 與 Jump 目標位址公式</h3>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-top: 0.75rem;">
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 6px; border-left: 4px solid #f59e0b; font-size: 0.86rem;">
          <strong style="color: #f59e0b;">beq（PC-Relative）</strong>
          <div style="font-family: var(--font-mono); background: var(--code-bg); padding: 0.6rem; border-radius: 4px; margin: 0.45rem 0;">
            Target = (PC + 4) + (SignExt(offset<sub>16</sub>) &lt;&lt; 2)
          </div>
          <div>條件成立判準：<code>PCSrc = Branch AND Zero</code>。</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 6px; border-left: 4px solid #a855f7; font-size: 0.86rem;">
          <strong style="color: #a855f7;">j（Pseudo-Direct）</strong>
          <div style="font-family: var(--font-mono); background: var(--code-bg); padding: 0.6rem; border-radius: 4px; margin: 0.45rem 0;">
            Target = (PC + 4)[31:28] || (addr<sub>26</sub> &lt;&lt; 2)
          </div>
          <div>跳轉控制：<code>Jump = 1</code> 強制覆寫 PC。</div>
        </div>
      </div>
    </div>

    <!-- 4. 課堂 Exercise 4 題速查 -->
    <div id="ch4CramExercises" class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3 class="card-title" style="color: var(--primary);">四、 課堂 Exercise 4 題速查（投影片 P49-P53）</h3>
      </div>

      <div style="overflow-x: auto; margin-top: 0.75rem;">
        <table class="data-table" style="font-size: 0.82rem; text-align: center;">
          <thead>
            <tr>
              <th>題號</th><th>指令</th><th>RegDst</th><th>ALUSrc</th><th>MemtoReg</th><th>RegWrite</th><th>MemRead</th><th>MemWrite</th><th>Branch</th><th>ALUOp</th><th>寫入目標</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>0</td><td><code>addi $t1, $t2, 5</code></td><td>0</td><td>1</td><td>0</td><td>1</td><td>0</td><td>0</td><td>0</td><td><code>00</code></td><td><code>$t1</code></td></tr>
            <tr><td>1</td><td><code>lw $t1, 8($s2)</code></td><td>0</td><td>1</td><td>1</td><td>1</td><td>1</td><td>0</td><td>0</td><td><code>00</code></td><td><code>$t1</code></td></tr>
            <tr><td>2</td><td><code>sw $t1, 8($s2)</code></td><td>X</td><td>1</td><td>X</td><td>0</td><td>0</td><td>1</td><td>0</td><td><code>00</code></td><td><code>Mem[R[$s2]+8]</code></td></tr>
            <tr><td>3</td><td><code>beq $t1, $t2, L (Not Taken)</code></td><td>X</td><td>0</td><td>X</td><td>0</td><td>0</td><td>0</td><td>1</td><td><code>01</code></td><td><code>PC &larr; PC+4</code></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 5. 關鍵路徑與效能瓶頸 -->
    <div id="ch4CramCriticalPath" class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3 class="card-title" style="color: var(--primary);">五、 關鍵路徑延遲與單週期瓶頸</h3>
      </div>

      <div style="font-size: 0.88rem; line-height: 1.75; color: var(--text-main); margin-top: 0.5rem;">
        • <strong>單週期關鍵路徑</strong>：固定由 <strong><code>lw</code></strong> 決定：
        $$T_{\\text{clk}} \\ge T_{\\text{PC}} + T_{\\text{I-Mem}} + \\max(T_{\\text{RegRead}}, T_{\\text{SignExt}} + T_{\\text{MUX}}) + T_{\\text{ALU}} + T_{\\text{D-Mem}} + T_{\\text{MUX}} + T_{\\text{setup}}$$
        • <strong>常考陷阱（Ex 4.7）</strong>：若 $T_{\\text{RegRead}} > T_{\\text{SignExt}} + T_{\\text{MUX}}$，則 <strong>ALUSrc MUX 不在 <code>lw</code> / <code>sw</code> / <code>addi</code> 關鍵路徑上</strong>。<br>
        • <strong>單週期缺陷</strong>：時脈受限於最慢指令 <code>lw</code>，違反「Make the common case fast」，硬體利用率低 &rarr; 解法為 <strong>Pipelining（五級管線化）</strong>。
      </div>
    </div>
  `;

  const jumpBtn = document.getElementById("btnJumpDatapathLab");
  if (jumpBtn) {
    jumpBtn.addEventListener("click", function() {
      const targetTabBtn = document.querySelector('.ch4-tab-btn[data-tab="tabCh4DatapathLab"]');
      if (targetTabBtn) targetTabBtn.click();
    });
  }

  if (window.CO_SOLVER && typeof window.CO_SOLVER.renderMath === "function") {
    window.CO_SOLVER.renderMath(container);
  }
}
