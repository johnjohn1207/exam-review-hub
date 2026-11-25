// Chapter 4 教科書課後習題互動練習模組 (Computer Organization and Design, §4.3 - §4.4, Ex 4.1 ~ 4.15)
// 完整對應單週期處理器範圍，支援分類篩選、數值即時批改、觀念草稿作答、詳解展開與進度持久化

window.CO_CH4_TEXTBOOK = (function() {
  const STORAGE_KEY = "co_ch4_textbook_done_v1";

  function getDoneSet() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return new Set();
    }
  }

  function saveDoneSet(set) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  const categories = [
    { id: "all", label: "全部單週期習題 (15)" },
    { id: "datapath", label: "資料路徑與控制 (4.1, 4.2, 4.5, 4.6)" },
    { id: "faults", label: "利用率與硬體故障 (4.3, 4.4, 4.14)" },
    { id: "timing", label: "延遲與效能權衡 (4.7 ~ 4.10, 4.15)" },
    { id: "design", label: "新指令架構擴充 (4.11 ~ 4.13)" }
  ];

  const exercises = [
    {
      id: "ex_4_1",
      num: "Ex 4.1",
      section: "§4.3",
      category: "datapath",
      title: "and 指令之控制訊號與硬體資源使用分析",
      difficulty: "基礎必考",
      prompt: `
        <p><strong>原題情境</strong>：考慮指令 <code>and $rd, $rs, $rt</code>（書中記作 <code>and rd, rs1, rs2</code>），其行為定義為 <code>Reg[rd] = Reg[rs] AND Reg[rt]</code>。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.1.1</strong>：單週期主控制單元（Control）針對此指令輸出的各控制訊號值為何？</li>
          <li><strong>4.1.2</strong>：哪些硬體資源（功能方塊）對此指令執行了「有效功能」？</li>
          <li><strong>4.1.3</strong>：哪些硬體資源「沒有產生輸出」？哪些硬體資源「有產生輸出但未被採用」？</li>
        </ol>
      `,
      numericChecks: [],
      solution: `
        <p><strong>4.1.1 主控制訊號值（標準 MIPS R-type）：</strong></p>
        <ul>
          <li><code>RegDst = 1</code>（選通 <code>rd</code>）、<code>ALUSrc = 0</code>（選通暫存器 Read data 2）、<code>MemtoReg = 0</code>（寫回 ALU 結果）</li>
          <li><code>RegWrite = 1</code>、<code>MemRead = 0</code>、<code>MemWrite = 0</code>、<code>Branch = 0</code>、<code>Jump = 0</code></li>
          <li><code>ALUOp = 10</code>（由 ALU Control 依據 <code>funct</code> 欄位解碼出 <code>0000</code> 執行 AND）</li>
        </ul>
        <p style="margin-top:0.6rem;"><strong>4.1.2 執行有效功能的資源（Blocks）：</strong></p>
        <ul>
          <li>PC、PC+4 加法器（Add 4）、Instruction Memory、Control Unit、RegDst MUX、Registers（讀與寫）、ALUSrc MUX、ALU Control、Main ALU、MemtoReg MUX、PCSrc MUX（選通 PC+4）、Jump MUX（選通非跳轉）。</li>
        </ul>
        <p style="margin-top:0.6rem;"><strong>4.1.3 無輸出 vs. 輸出未被採用之資源（高頻觀念題）：</strong></p>
        <ul>
          <li><strong>無輸出（Produce no output）</strong>：<strong>Data Memory</strong>（因 <code>MemRead = 0</code> 且 <code>MemWrite = 0</code>，資料記憶體不驅動有效讀出資料）。</li>
          <li><strong>有產生輸出但未被採用（Unused output）</strong>：<strong>Sign-extend</strong>（仍對 Bits 15:0 進行符號延展，但 ALUSrc MUX 選 0 忽略之）、<strong>Shift left 2（Branch 與 Jump）</strong>、<strong>Branch Adder</strong>（仍計算分支目標位址，但因 <code>Branch = 0</code> 導致 PCSrc MUX 選 0 忽略之）。</li>
        </ul>
      `
    },
    {
      id: "ex_4_2",
      num: "Ex 4.2",
      section: "§4.4",
      category: "datapath",
      title: "主控制真值表中所有 Don't Care (X) 欄位成因解析",
      difficulty: "觀念必考",
      prompt: `
        <p><strong>原題</strong>：Explain each of the "don't cares" in the main control truth table (Figure 4.18).</p>
        <p>請解釋在單週期主控制真值表中，<code>sw</code> 與 <code>beq</code>（以及 <code>j</code>）指令裡出現的每一個 <code>X</code>（Don't Care）背後之硬體原因。</p>
      `,
      numericChecks: [],
      solution: `
        <p><strong>核心判斷原則</strong>：只要某個寫入致能訊號為 <code>0</code>（例如 <code>RegWrite = 0</code>），其上游負責選擇「寫入位址」或「寫入資料」的多工器無論選 0 或 1，都不會改變處理器狀態，因此可標記為 <code>X</code> 以化簡控制邏輯閘。</p>
        <ul>
          <li><strong>sw 指令</strong>：<code>RegWrite = 0</code>（不寫入暫存器），因此 <code>RegDst = X</code>（無須決定寫入 rt 或 rd）、<code>MemtoReg = X</code>（無須決定寫回 ALU 結果或記憶體資料）。</li>
          <li><strong>beq 指令</strong>：<code>RegWrite = 0</code>（不寫入暫存器），同理 <code>RegDst = X</code>、<code>MemtoReg = X</code>。</li>
          <li><strong>j 指令（Jump 擴充）</strong>：因 <code>RegWrite = 0</code>、<code>MemRead = 0</code>、<code>MemWrite = 0</code>、<code>Branch = 0</code> 且 <code>Jump = 1</code> 強制覆寫 PC，故 <code>RegDst = X</code>、<code>ALUSrc = X</code>、<code>MemtoReg = X</code>、<code>ALUOp = XX</code>。</li>
        </ul>
      `
    },
    {
      id: "ex_4_3",
      num: "Ex 4.3",
      section: "§4.4",
      category: "faults",
      title: "指令混合比例與硬體單元使用率計算",
      difficulty: "必考計算",
      prompt: `
        <p><strong>原題指令混合比例（Instruction Mix）</strong>：</p>
        <div style="overflow-x:auto; margin: 0.5rem 0;">
          <table class="truth-table" style="font-size:0.84rem;">
            <thead><tr><th>R-type</th><th>I-type (non-lw)</th><th>Load (lw)</th><th>Store (sw)</th><th>Branch (beq)</th><th>Jump (j)</th></tr></thead>
            <tbody><tr><td>24%</td><td>28%</td><td>25%</td><td>10%</td><td>11%</td><td>2%</td></tr></tbody>
          </table>
        </div>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.3.1</strong>：有多少比例（%）的指令會使用到 Data Memory？</li>
          <li><strong>4.3.2</strong>：有多少比例（%）的指令會使用到 Instruction Memory？</li>
          <li><strong>4.3.3</strong>：有多少比例（%）的指令會使用到 Sign-Extend？</li>
          <li><strong>4.3.4</strong>：在不需要 Sign-Extend 輸出的週期中，該硬體實際上在做什麼？</li>
        </ol>
      `,
      numericChecks: [
        { label: "4.3.1 Data Memory 使用率 (%)", answer: 35, tolerance: 0.1, unit: "%", placeholder: "例如：35" },
        { label: "4.3.2 Instruction Memory 使用率 (%)", answer: 100, tolerance: 0.1, unit: "%", placeholder: "例如：100" },
        { label: "4.3.3 Sign-Extend 使用率 (%)", answer: 74, tolerance: 0.1, unit: "%", placeholder: "例如：74" }
      ],
      solution: `
        <ul>
          <li><strong>4.3.1 Data Memory</strong>：僅 <code>Load</code> 與 <code>Store</code> 使用資料記憶體，故比例為 $25\\% + 10\\% = \\mathbf{35\\%}$。</li>
          <li><strong>4.3.2 Instruction Memory</strong>：每一條指令都必須先擷取（IF 階段），故比例為 $\\mathbf{100\\%}$。</li>
          <li><strong>4.3.3 Sign-Extend</strong>：除了 <code>R-type</code>（無立即值）與 <code>Jump</code>（26 位元目標位址直接左移 2 位，不經符號延展）之外，其餘 I-type 指令皆須使用 Sign-Extend：$28\\% + 25\\% + 10\\% + 11\\% = \\mathbf{74\\%}$（或 $100\\% - 24\\% - 2\\% = 74\\%$）。</li>
          <li><strong>4.3.4 閒置週期行為</strong>：Sign-Extend 為純組合邏輯電路（無 Enable 控制線），即使該週期不需要其輸出，它<strong>依然會將指令的 Bits 15:0 進行符號延展並輸出結果</strong>，只是下游多工器（ALUSrc MUX / PCSrc MUX）未選通該路徑而將其忽略。</li>
        </ul>
      `
    },
    {
      id: "ex_4_4",
      num: "Ex 4.4",
      section: "§4.4",
      category: "faults",
      title: "晶片製程缺陷：Stuck-at-0 硬體故障影響分析",
      difficulty: "期末高頻",
      prompt: `
        <p><strong>原題情境</strong>：矽晶片製造缺陷可能導致某條控制訊號線斷裂並永遠輸出邏輯 <code>0</code>（稱為 <strong>stuck-at-0 fault</strong>）。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.4.1</strong>：若 <code>MemtoReg</code> 控制線發生 stuck-at-0 故障，哪些指令會執行失敗？</li>
          <li><strong>4.4.2</strong>：若 <code>ALUSrc</code> 控制線發生 stuck-at-0 故障，哪些指令會執行失敗？</li>
        </ol>
      `,
      numericChecks: [],
      solution: `
        <p><strong>解題原則</strong>：查核主控制真值表，凡是「原本需要該訊號為 <code>1</code>」的指令皆會失效；原本為 <code>0</code> 或 <code>X</code> 的指令則不受影響。</p>
        <ul>
          <li><strong>4.4.1 MemtoReg stuck-at-0</strong>：<strong>僅 <code>lw</code>（Load 指令）失效</strong>。因 <code>lw</code> 需要 <code>MemtoReg = 1</code> 將記憶體資料寫回暫存器；卡在 0 時會錯誤地把「記憶體位址（ALU Result）」寫入目的暫存器。其餘 R-type、addi（原本即為 0）與 sw、beq、j（為 X）皆正常運作。</li>
          <li><strong>4.4.2 ALUSrc stuck-at-0</strong>：<strong>所有使用立即值進入 ALU 的指令皆失效</strong>，包含 <code>lw</code>、<code>sw</code> 以及立即運算 I-type 指令（如 <code>addi</code>、<code>andi</code>）。因 ALUSrc 卡在 0 會強制將暫存器 Read data 2 送入 ALU，無法加上偏移量或立即值。R-type、<code>beq</code>（原本即為 0）與 <code>j</code>（為 X）仍正常。</li>
        </ul>
      `
    },
    {
      id: "ex_4_5",
      num: "Ex 4.5",
      section: "§4.4",
      category: "datapath",
      title: "單週期指令機器碼全路徑數值追蹤",
      difficulty: "進階綜合",
      prompt: `
        <p><strong>原題情境</strong>：處理器在某一時脈週期擷取到 32 位元機器碼，請追蹤其完整的硬體埠口數值。</p>
        <p style="font-size:0.85rem; color:var(--text-muted);">註：本 PDF 為第 6 版，原題給定之 <code>0x00c6ba23</code> 對應 RISC-V <code>sw x12, 20(x13)</code>；為完全對齊本課程 MIPS 架構，下方同時提供等價 MIPS 機器碼 <code>0xADAC0014</code>（即 <code>sw $t4, 20($t5)</code>，<code>rs=13, rt=12, imm=20</code>）供追蹤演練。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.5.1</strong>：ALU Control 單元的輸入值為何？</li>
          <li><strong>4.5.2</strong>：此指令執行完畢後的新 PC 位址為何？</li>
          <li><strong>4.5.3</strong>：各 MUX（RegDst, ALUSrc, MemtoReg, PCSrc）的輸入與輸出為何？</li>
          <li><strong>4.5.4</strong>：Main ALU 與兩顆 Adder（PC+4、Branch Adder）的輸入值為何？</li>
          <li><strong>4.5.5</strong>：Register File 所有輸入埠（Read reg 1, Read reg 2, Write reg, Write data, RegWrite）之數值為何？</li>
        </ol>
      `,
      numericChecks: [],
      solution: `
        <p><strong>以等價 MIPS <code>sw $t4, 20($t5)</code>（Opcode = <code>101011</code>, <code>rs = 13</code>, <code>rt = 12</code>, <code>imm = 20</code>）追蹤：</strong></p>
        <ul>
          <li><strong>4.5.1 ALU Control 輸入</strong>：<code>ALUOp = 00</code>（來自 Main Control）；<code>funct = 010100</code>（即 imm 的低 6 位元，但因 <code>ALUOp = 00</code>，ALU Control 直接忽略 funct 並輸出 <code>0010</code> 執行加法）。</li>
          <li><strong>4.5.2 新 PC 位址</strong>：<code>PC + 4</code>（因 <code>Branch = 0</code> 且 <code>Jump = 0</code>，經 PC+4 Adder &rarr; PCSrc MUX (0) &rarr; Jump MUX (0) &rarr; PC）。</li>
          <li><strong>4.5.3 各 MUX 狀態</strong>：
            <ul>
              <li><code>RegDst MUX</code>：輸入 0 = 12 (<code>rt</code>)、輸入 1 = 0 (<code>rd</code> 欄位)、控制 = <code>X</code>（不影響）。</li>
              <li><code>ALUSrc MUX</code>：輸入 0 = <code>Reg[12]</code>、輸入 1 = <code>20</code>、控制 = <code>1</code> &rarr; 輸出 <strong>20</strong>。</li>
              <li><code>MemtoReg MUX</code>：控制 = <code>X</code>（不寫回）。</li>
              <li><code>PCSrc MUX</code>：輸入 0 = <code>PC + 4</code>、輸入 1 = <code>(PC + 4) + (20 &lt;&lt; 2) = PC + 84</code>、控制 = <code>0</code> &rarr; 輸出 <strong>PC + 4</strong>。</li>
            </ul>
          </li>
          <li><strong>4.5.4 ALU 與兩顆 Adder 輸入</strong>：Main ALU 輸入為 <code>Reg[13]</code> 與 <code>20</code>；PC+4 Adder 輸入為 <code>PC</code> 與 <code>4</code>；Branch Adder 輸入為 <code>PC + 4</code> 與 <code>80</code>（<code>20 &lt;&lt; 2</code>）。</li>
          <li><strong>4.5.5 Registers 輸入</strong>：Read reg 1 = <code>13</code>、Read reg 2 = <code>12</code>、Write reg = <code>12 或 0</code>（Don't Care）、Write data = <code>ALU Result 或 D-Mem</code>（Don't Care）、<code>RegWrite = 0</code>。</li>
        </ul>
      `
    },
    {
      id: "ex_4_6",
      num: "Ex 4.6",
      section: "§4.4",
      category: "datapath",
      title: "擴充 I-type 立即運算指令（addi / andi）之硬體與控制訊號",
      difficulty: "課堂重點",
      prompt: `
        <p><strong>原題情境</strong>：課本第 4.4 節的基礎單週期處理器未討論 <code>addi</code> 或 <code>andi</code> 等 I-type 算術／邏輯指令。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.6.1</strong>：若要支援 <code>addi</code>（與 <code>andi</code>），基礎單週期資料路徑需要新增任何硬體邏輯方塊嗎？請說明原因。</li>
          <li><strong>4.6.2</strong>：列出 <code>addi</code> 的完整主控制訊號值，並解釋是否有任何 Don't Care 訊號。</li>
        </ol>
      `,
      numericChecks: [],
      solution: `
        <ul>
          <li><strong>4.6.1 硬體修改分析</strong>：
            <ul>
              <li>對於 <strong><code>addi</code></strong>：<strong>完全不需要新增任何資料路徑硬體方塊！</strong>現有的 Sign-extend、ALUSrc MUX（選 1）、ALU（<code>ALUOp = 00</code> 執行加法）、MemtoReg MUX（選 0）與 RegDst MUX（選 0 寫入 <code>rt</code>）已完全具備所需通路，僅需在主控制單元新增對應 Opcode（<code>001000</code>）的解碼列。</li>
              <li>對於 <strong><code>andi</code></strong>（進階補充）：因 MIPS 規定邏輯立即指令採用<strong>零擴充（Zero-extend）</strong>而非符號擴充，且 ALUOp 需能指定 ALU 執行 AND（例如擴充為 <code>ALUOp = 11</code>），故需在 Sign-extend 旁新增 Zero-extend 並加一顆 MUX 選通。</li>
            </ul>
          </li>
          <li><strong>4.6.2 <code>addi</code> 控制訊號表</strong>：
            <code>RegDst = 0</code>、<code>ALUSrc = 1</code>、<code>MemtoReg = 0</code>、<code>RegWrite = 1</code>、<code>MemRead = 0</code>、<code>MemWrite = 0</code>、<code>Branch = 0</code>、<code>Jump = 0</code>、<code>ALUOp = 00</code>。
            <strong>沒有任何 Don't Care（X）</strong>，因為 <code>RegWrite = 1</code> 需要明確指定 <code>RegDst = 0</code> 與 <code>MemtoReg = 0</code>，且需明確禁止記憶體讀寫與分支跳轉。
          </li>
        </ul>
      `
    },
    {
      id: "ex_4_7",
      num: "Ex 4.7",
      section: "§4.4",
      category: "timing",
      title: "10 元件精細延遲表與各指令關鍵路徑計算（含 clk-to-q 與 Setup）",
      difficulty: "期末大魔王",
      prompt: `
        <p><strong>原題硬體延遲表（單位：ps）</strong>：</p>
        <div style="overflow-x:auto; margin: 0.5rem 0;">
          <table class="truth-table" style="font-size:0.8rem;">
            <thead>
              <tr><th>I-Mem / D-Mem</th><th>Reg File</th><th>Mux</th><th>ALU</th><th>Adder</th><th>Single gate</th><th>Reg Read (PC)</th><th>Reg Setup</th><th>Sign-ext</th><th>Control</th></tr>
            </thead>
            <tbody>
              <tr><td>250</td><td>150</td><td>25</td><td>200</td><td>150</td><td>5</td><td>30</td><td>20</td><td>50</td><td>50</td></tr>
            </tbody>
          </table>
        </div>
        <p style="font-size:0.84rem; color:#fbbf24;">⚠️ 原題關鍵提醒：<code>Reg Read (30 ps)</code> 僅套用於 PC 輸出；<code>Reg Setup (20 ps)</code> 套用於 PC 與 Register File 寫入端。請小心不要把「非關鍵路徑上的 MUX」誤算進去！</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.7.1</strong>：R-type 指令的總延遲為何？</li>
          <li><strong>4.7.2</strong>：<code>lw</code> 指令的總延遲為何？（陷阱題：檢查 ALUSrc MUX 是否在關鍵路徑上！）</li>
          <li><strong>4.7.3</strong>：<code>sw</code> 指令的總延遲為何？</li>
          <li><strong>4.7.4</strong>：<code>beq</code> 指令的總延遲為何？</li>
          <li><strong>4.7.5</strong>：I-type 算術／邏輯（non-load，如 <code>addi</code>）指令的總延遲為何？</li>
          <li><strong>4.7.6</strong>：此單週期 CPU 的最小時脈週期（Minimum Clock Period）為何？</li>
        </ol>
      `,
      numericChecks: [
        { label: "4.7.1 R-type 延遲 (ps)", answer: 700, tolerance: 0, unit: "ps", placeholder: "輸入整數" },
        { label: "4.7.2 lw 延遲 (ps)", answer: 925, tolerance: 0, unit: "ps", placeholder: "注意 ALUSrc MUX!" },
        { label: "4.7.3 sw 延遲 (ps)", answer: 880, tolerance: 0, unit: "ps", placeholder: "輸入整數" },
        { label: "4.7.4 beq 延遲 (ps)", answer: 705, tolerance: 0, unit: "ps", placeholder: "含 AND 閘與 PCSrc MUX" },
        { label: "4.7.5 I-type non-lw 延遲 (ps)", answer: 675, tolerance: 0, unit: "ps", placeholder: "輸入整數" },
        { label: "4.7.6 最小時脈週期 (ps)", answer: 925, tolerance: 0, unit: "ps", placeholder: "取最大值" }
      ],
      solution: `
        <ul>
          <li><strong>4.7.1 R-type（700 ps）</strong>：
            $$T_R = 30\\text{ (PC)} + 250\\text{ (I-Mem)} + 150\\text{ (RegFile)} + 25\\text{ (ALUSrc Mux)} + 200\\text{ (ALU)} + 25\\text{ (MemtoReg Mux)} + 20\\text{ (Reg Setup)} = \\mathbf{700\\text{ ps}}$$
            （R-type 的第二運算元 Read data 2 必須經過 ALUSrc MUX，故須加上 25 ps。）
          </li>
          <li><strong>4.7.2 lw（925 ps — 經典陷阱！）</strong>：
            進入 ALU 的兩條並行路徑：
            (A) <code>RegFile Read = 150 ps</code>（直入 ALU 輸入 1）；
            (B) <code>Sign-ext (50) + ALUSrc Mux (25) = 75 ps</code>（入 ALU 輸入 2）。
            因 $150 > 75$，<strong>ALUSrc MUX 並不在 lw 的關鍵路徑上</strong>！
            $$T_{lw} = 30 + 250 + 150 + 200\\text{ (ALU)} + 250\\text{ (D-Mem)} + 25\\text{ (MemtoReg Mux)} + 20\\text{ (Reg Setup)} = \\mathbf{925\\text{ ps}}$$
          </li>
          <li><strong>4.7.3 sw（880 ps）</strong>：
            同理 ALUSrc MUX 不在關鍵路徑上，且無須經 MemtoReg MUX 與 Reg Setup：
            $$T_{sw} = 30 + 250 + 150 + 200 + 250\\text{ (D-Mem)} = \\mathbf{880\\text{ ps}}$$
          </li>
          <li><strong>4.7.4 beq（705 ps）</strong>：
            比較路徑（ALU 產出 Zero &rarr; AND 閘 &rarr; PCSrc MUX &rarr; PC Setup）耗時：
            $$30 + 250 + 150 + 25\\text{ (ALUSrc Mux)} + 200\\text{ (ALU)} + 5\\text{ (AND)} + 25\\text{ (PCSrc Mux)} + 20\\text{ (PC Setup)} = \\mathbf{705\\text{ ps}}$$
            （遠大於分支目標位址計算路徑 $30+250+50+150+25+20 = 525\\text{ ps}$。）
          </li>
          <li><strong>4.7.5 I-type non-lw（675 ps）</strong>：
            與 <code>lw</code> 相同，ALUSrc MUX 被 RegFile 讀取遮蔽，但跳過 D-Mem：
            $$T_{I} = 30 + 250 + 150 + 200 + 25\\text{ (MemtoReg Mux)} + 20\\text{ (Reg Setup)} = \\mathbf{675\\text{ ps}}$$
          </li>
          <li><strong>4.7.6 最小時脈週期</strong>：$\\max(700, 925, 880, 705, 675) = \\mathbf{925\\text{ ps}}$。</li>
        </ul>
      `
    },
    {
      id: "ex_4_8",
      num: "Ex 4.8",
      section: "§4.4",
      category: "timing",
      title: "可變時脈週期（Variable Clock）之加速比計算",
      difficulty: "必考計算",
      prompt: `
        <p><strong>原題</strong>：承 Ex 4.7 之各指令延遲，假設可以打造一顆「每條指令採用各自專屬時脈週期」的 CPU，在以下指令混合比例下，新 CPU 相較於固定單週期 CPU 的加速比（Speedup）為何？</p>
        <div style="overflow-x:auto; margin: 0.5rem 0;">
          <table class="truth-table" style="font-size:0.84rem;">
            <thead><tr><th>R-type / I-type (non-lw)</th><th>lw</th><th>sw</th><th>beq</th></tr></thead>
            <tbody><tr><td>52%（以 700 ps 計）</td><td>25%（925 ps）</td><td>11%（880 ps）</td><td>12%（705 ps）</td></tr></tbody>
          </table>
        </div>
      `,
      numericChecks: [
        { label: "4.8 加速比 Speedup（小數點後兩位）", answer: 1.19, tolerance: 0.02, unit: "x", placeholder: "例如：1.19" }
      ],
      solution: `
        <p>1. <strong>計算可變時脈 CPU 之平均每指令時間</strong>：</p>
        $$T_{\\text{avg}} = 0.52 \\times 700 + 0.25 \\times 925 + 0.11 \\times 880 + 0.12 \\times 705$$
        $$= 364 + 231.25 + 96.8 + 84.6 = \\mathbf{776.65\\text{ ps}}$$
        <p>2. <strong>計算加速比（Speedup）</strong>：</p>
        $$\\text{Speedup} = \\frac{T_{\\text{single-cycle}}}{T_{\\text{avg}}} = \\frac{925}{776.65} \\approx \\mathbf{1.19\\times}$$
      `
    },
    {
      id: "ex_4_9",
      num: "Ex 4.9",
      section: "§4.4",
      category: "timing",
      title: "新增硬體乘法器對時脈與執行效能之權衡分析",
      difficulty: "期末高頻",
      prompt: `
        <p><strong>原題</strong>：承 Ex 4.7（原 ALU 延遲 200 ps、原時脈 925 ps）。若在 ALU 中整合硬體乘法器，會使 ALU 延遲<strong>增加 300 ps</strong>，但可讓程式總指令數<strong>減少 5%</strong>。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.9.1</strong>：加入此改進後的時脈週期（ps）為何？</li>
          <li><strong>4.9.2</strong>：加入此改進後的加速比（Speedup）為何？（保留小數點後兩位）</li>
          <li><strong>4.9.3</strong>：新 ALU 最慢可以是多少 ps，才能讓整體效能仍呈現正向提升（Speedup &gt; 1）？</li>
        </ol>
      `,
      numericChecks: [
        { label: "4.9.1 新時脈週期 (ps)", answer: 1225, tolerance: 0, unit: "ps", placeholder: "例如：1225" },
        { label: "4.9.2 加速比 Speedup", answer: 0.79, tolerance: 0.015, unit: "x", placeholder: "例如：0.79" },
        { label: "4.9.3 最大允許新 ALU 延遲 (ps)", answer: 248.7, tolerance: 0.5, unit: "ps", placeholder: "例如：248.7" }
      ],
      solution: `
        <ul>
          <li><strong>4.9.1 時脈週期比較</strong>：原時脈 $925\\text{ ps}$；因 ALU 位於關鍵路徑上，新時脈為 $925 + 300 = \\mathbf{1225\\text{ ps}}$。</li>
          <li><strong>4.9.2 加速比計算</strong>：
            $$\\text{Speedup} = \\frac{\\text{IC} \\times 925}{0.95 \\times \\text{IC} \\times 1225} = \\frac{925}{1163.75} \\approx \\mathbf{0.795\\times}$$
            （小於 1，代表整體效能反而<strong>變慢約 20.5%</strong>，得不償失！）
          </li>
          <li><strong>4.9.3 效能收支平衡點（新 ALU 延遲上限）</strong>：
            欲使效能提升，須滿足 $0.95 \\times T_{\\text{clk,new}} < 925$：
            $$T_{\\text{clk,new}} < \\frac{925}{0.95} \\approx 973.68\\text{ ps}$$
            ALU 最多僅能增加 $973.68 - 925 = 48.68\\text{ ps}$，故新 ALU 總延遲上限為：
            $$200 + 48.68 = \\mathbf{248.68\\text{ ps}}$$
          </li>
        </ul>
      `
    },
    {
      id: "ex_4_10",
      num: "Ex 4.10",
      section: "§4.4",
      category: "timing",
      title: "暫存器加倍（32 → 64）之成本與效能權衡分析",
      difficulty: "進階計算",
      prompt: `
        <p><strong>原題</strong>：承 Ex 4.7 延遲與 Ex 4.8 指令比例（<code>lw 25%</code>, <code>sw 11%</code>）。假設各硬體元件成本為：I-Mem=1000, D-Mem=2000, RegFile=200, ALU=100, Adder=30 (x2), Mux=10 (x4), PC Reg=5, Sign-ext=100, Gate=1, Control=500（總成本 4006）。</p>
        <p>若將暫存器數量由 32 個加倍至 64 個，可讓 <strong>lw 與 sw 指令數減少 12%</strong>，但 Register File 延遲由 150 ps 增至 <strong>160 ps</strong>，且其成本由 200 倍增至 <strong>400</strong>。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.10.1</strong>：此改進帶來的加速比（Speedup）為何？（保留小數點後三位）</li>
          <li><strong>4.10.2</strong>：效能提升百分比 vs. 總硬體成本增加百分比為何？</li>
          <li><strong>4.10.3</strong>：在什麼應用場景下值得加倍暫存器？什麼場景下不值得？</li>
        </ol>
      `,
      numericChecks: [
        { label: "4.10.1 加速比 Speedup", answer: 1.034, tolerance: 0.005, unit: "x", placeholder: "例如：1.034" },
        { label: "4.10.2 總成本增加百分比 (%)", answer: 5.0, tolerance: 0.2, unit: "%", placeholder: "例如：5.0" }
      ],
      solution: `
        <ul>
          <li><strong>4.10.1 加速比計算</strong>：
            <ul>
              <li>原 <code>lw + sw</code> 佔總指令數 $25\\% + 11\\% = 36\\%$。減少 12% 後，總指令數降幅為 $0.36 \\times 0.12 = 4.32\\%$，即 $\\text{IC}_{\\text{new}} = 0.9568 \\times \\text{IC}$。</li>
              <li>Register File 位於關鍵路徑，新時脈為 $925 + (160 - 150) = 935\\text{ ps}$。</li>
              <li>$$\\text{Speedup} = \\frac{\\text{IC} \\times 925}{0.9568 \\times \\text{IC} \\times 935} = \\frac{925}{894.61} \\approx \\mathbf{1.034\\times}\\text{（效能提升 3.4%）}$$</li>
            </ul>
          </li>
          <li><strong>4.10.2 成本與效能對比</strong>：
            總硬體成本由 $4006$ 增至 $4206$，成本上升 $\\frac{200}{4006} \\approx \\mathbf{4.99\\%}$（約 5.0%）。相較之下，效能僅提升 3.4%，成本增幅高於效能增幅。
          </li>
          <li><strong>4.10.3 決策情境</strong>：
            <ul>
              <li><strong>值得</strong>：高效能伺服器／科學運算（重視極致效能、對晶片面積成本較不敏感，或工作負載中 <code>lw/sw</code> 佔比極高）。</li>
              <li><strong>不值得</strong>：低價嵌入式系統／IoT 裝置（追求成本效益比 Cost/Performance 最優化）。</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      id: "ex_4_11",
      num: "Ex 4.11",
      section: "§4.4",
      category: "design",
      title: "新指令擴充設計：lwi.d rd, rs, rt（索引定址載入）",
      difficulty: "期末大題",
      prompt: `
        <p><strong>原題</strong>：評估在 MIPS 單週期處理器中新增指令 <code>lwi.d $rd, $rs, $rt</code>（Load With Indexed Offset）的硬體修改需求。</p>
        <p>指令語意：<code>Reg[rd] = Mem[Reg[rs] + Reg[rt]]</code>（以 R-type 編碼，兩暫存器相加作為記憶體位址，讀出資料寫入 <code>rd</code>）。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.11.1</strong>：需要新增任何新的硬體功能方塊嗎？</li>
          <li><strong>4.11.2</strong>：有哪些既有功能方塊需要修改？</li>
          <li><strong>4.11.3</strong>：需要新增任何新的資料路徑導線嗎？</li>
          <li><strong>4.11.4</strong>：控制單元需要新增任何控制訊號嗎？</li>
        </ol>
      `,
      numericChecks: [],
      solution: `
        <p><strong>驚人結論：硬體資料路徑「完全零修改」！</strong></p>
        <ul>
          <li><strong>4.11.1 新功能方塊</strong>：<strong>不需要（None）</strong>。</li>
          <li><strong>4.11.2 既有方塊修改</strong>：<strong>僅需修改 Main Control Unit 的真值表</strong>（增加對應 Opcode 的輸出組合），無須改動任何資料路徑元件。</li>
          <li><strong>4.11.3 新資料路徑</strong>：<strong>不需要（None）</strong>。既有通路即可串接：<code>rs, rt</code> 讀出 &rarr; <code>ALUSrc = 0</code> 進 ALU 加法 &rarr; 送入 Data Memory Address &rarr; <code>MemRead = 1</code> &rarr; <code>MemtoReg = 1</code> &rarr; <code>RegDst = 1</code> 寫入 <code>rd</code>。</li>
          <li><strong>4.11.4 新控制訊號</strong>：<strong>不需要（None）</strong>。僅需設定既有訊號組合：<code>RegDst=1, ALUSrc=0, MemtoReg=1, RegWrite=1, MemRead=1, MemWrite=0, Branch=0, ALUOp=00</code>。</li>
        </ul>
      `
    },
    {
      id: "ex_4_12",
      num: "Ex 4.12",
      section: "§4.4",
      category: "design",
      title: "新指令擴充設計：swap rs, rt（單週期互換暫存器）",
      difficulty: "期末大題",
      prompt: `
        <p><strong>原題</strong>：評估在 MIPS 單週期處理器中新增指令 <code>swap $rs, $rt</code> 的硬體修改需求。</p>
        <p>指令語意：<code>Reg[rt] = Reg[rs]; Reg[rs] = Reg[rt]</code>（於同一個時脈週期內完成兩個暫存器數值互換）。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.12.1 ~ 4.12.2</strong>：需要新增或修改哪些功能方塊？</li>
          <li><strong>4.12.3</strong>：需要新增哪些資料路徑導線？</li>
          <li><strong>4.12.4</strong>：控制單元需要新增哪些控制訊號？</li>
        </ol>
      `,
      numericChecks: [],
      solution: `
        <p><strong>關鍵瓶頸</strong>：標準 Register File 僅有 <strong>1 個寫入埠（Write Port）</strong>，無法在單一週期同時寫入 <code>rs</code> 與 <code>rt</code> 兩個暫存器！</p>
        <ul>
          <li><strong>4.12.1 ~ 4.12.2 功能方塊修改</strong>：
            <ul>
              <li><strong>修改 Register File</strong>：必須新增<strong>第二組寫入埠</strong>（<code>Write register 2</code> 與 <code>Write data 2</code>）及對應寫入致能端 <code>RegWrite2</code>。</li>
              <li><strong>擴充 MemtoReg MUX</strong>（或新增 2 對 1 MUX）：讓 <code>Write data 1</code> 除了 ALU/D-Mem 之外，也能選擇 <code>Read data 1</code>（將 <code>Reg[rs]</code> 寫給 <code>rt</code>）。</li>
            </ul>
          </li>
          <li><strong>4.12.3 新增資料路徑</strong>：
            <ul>
              <li><code>Inst[25:21] (rs)</code> 接至 <code>Write register 2</code>。</li>
              <li><code>Read data 2 (Reg[rt])</code> 接至 <code>Write data 2</code>。</li>
              <li><code>Read data 1 (Reg[rs])</code> 經新增的 MUX 接至 <code>Write data 1</code>（而 <code>Write register 1</code> 透過 <code>RegDst = 0</code> 選通 <code>rt</code>）。</li>
            </ul>
          </li>
          <li><strong>4.12.4 新增控制訊號</strong>：新增 <code>Swap</code>（或 <code>RegWrite2</code>）訊號：當執行 <code>swap</code> 時設為 <code>1</code>，同時致能第二寫入埠並切換寫入資料來源 MUX；其餘指令設為 <code>0</code>。</li>
        </ul>
      `
    },
    {
      id: "ex_4_13",
      num: "Ex 4.13",
      section: "§4.4",
      category: "design",
      title: "新指令擴充設計：ss rt, rs, imm（Store Sum 指令）",
      difficulty: "期末大題",
      prompt: `
        <p><strong>原題</strong>：評估在 MIPS 單週期處理器中新增指令 <code>ss $rt, $rs, imm</code>（Store Sum）的硬體修改需求。</p>
        <p>指令語意：<code>Mem[Reg[rt]] = Reg[rs] + immediate</code>（以 <code>Reg[rt]</code> 作為記憶體位址，並將 <code>Reg[rs] + imm</code> 的計算結果寫入該記憶體位址）。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.13.1 ~ 4.13.2</strong>：需要新增哪些功能方塊（MUX）？</li>
          <li><strong>4.13.3</strong>：需要新增哪些資料路徑導線？</li>
          <li><strong>4.13.4</strong>：控制單元需要新增哪些控制訊號？</li>
        </ol>
      `,
      numericChecks: [],
      solution: `
        <p><strong>核心差異對照</strong>：標準 <code>sw</code> 是「ALU 算位址 &rarr; 接 Data Memory Address；Read data 2 當資料 &rarr; 接 Write data」。而 <code>ss</code> 剛好<strong>顛倒</strong>：「Read data 2 (<code>Reg[rt]</code>) 當位址；ALU 算出的 <code>Reg[rs] + imm</code> 當寫入資料」！</p>
        <ul>
          <li><strong>4.13.1 ~ 4.13.2 新增功能方塊</strong>：新增 <strong>2 顆 2 對 1 多工器（MUX）</strong>，分別置於 Data Memory 的 <code>Address</code> 輸入端與 <code>Write data</code> 輸入端。</li>
          <li><strong>4.13.3 新增資料路徑</strong>：
            <ul>
              <li>從 <code>Registers</code> 的 <code>Read data 2</code> 拉線至新增的「Address MUX」輸入 1（輸入 0 維持接 ALU Result）。</li>
              <li>從 <code>ALU Result</code> 拉線至新增的「Write data MUX」輸入 1（輸入 0 維持接 Read data 2）。</li>
            </ul>
          </li>
          <li><strong>4.13.4 新增控制訊號</strong>：新增 1 位元控制訊號 <code>StoreSum</code>（同時控制上述兩顆 MUX）。執行 <code>ss</code> 時設為 <code>1</code>，並搭配 <code>ALUSrc=1, MemWrite=1, MemRead=0, RegWrite=0, Branch=0, ALUOp=00</code>。</li>
        </ul>
      `
    },
    {
      id: "ex_4_14",
      num: "Ex 4.14",
      section: "§4.4",
      category: "faults",
      title: "Sign-Extend（Imm Gen）是否位於關鍵路徑上？",
      difficulty: "觀念陷阱",
      prompt: `
        <p><strong>原題</strong>：For which instructions (if any) is the Sign-Extend (Imm Gen) block on the critical path?（請搭配 Ex 4.7 延遲表判斷。）</p>
      `,
      numericChecks: [],
      solution: `
        <p><strong>答案：沒有任何指令（None）！</strong></p>
        <p><strong>原因推導</strong>：在 Ex 4.7 的延遲參數下，指令擷取完成後會同時啟動三條並行路徑：</p>
        <ul>
          <li><strong>Register File 讀取路徑</strong>：耗時 <code>150 ps</code>。</li>
          <li><strong>Sign-Extend + ALUSrc MUX 路徑</strong>：耗時 <code>50 + 25 = 75 ps</code>（遠快於 Register File 讀取的 150 ps，故在 <code>lw</code>、<code>sw</code>、<code>addi</code> 中完全被遮蔽）。</li>
          <li><strong>分支目標計算路徑（Sign-Extend + Branch Adder）</strong>：耗時 <code>50 + 150 = 200 ps</code>，仍快於 <code>beq</code> 的 ALU 比較路徑（<code>150 + 25 + 200 + 5 = 380 ps</code>）。</li>
        </ul>
        <p>因此，Sign-Extend 並不在任何一條指令的關鍵路徑上。</p>
      `
    },
    {
      id: "ex_4_15",
      num: "Ex 4.15",
      section: "§4.4",
      category: "timing",
      title: "架構權衡：移除 lw/sw 偏移量以縮短時脈週期是否划算？",
      difficulty: "期末大題",
      prompt: `
        <p><strong>原題</strong>：承 Ex 4.7 延遲表與 Ex 4.8 指令混合比例（<code>lw 25%</code>, <code>sw 11%</code>）。若修改 ISA 使 <code>lw</code> 與 <code>sw</code> <strong>不再支援偏移量（No Offset）</strong>，改為直接用 <code>Reg[rs]</code> 當記憶體位址，使兩者不再經過 ALU，但原本的每條 <code>lw/sw</code> 都必須拆成 2 條指令（先 <code>add</code> 算位址，再 <code>lw/sw</code>）。</p>
        <ol style="margin: 0.5rem 0 0 1.25rem; line-height: 1.75;">
          <li><strong>4.15.1</strong>：新架構下的最小時脈週期（ps）為何？</li>
          <li><strong>4.15.2</strong>：在 Ex 4.8 指令比例下，新 CPU 的加速比為何？（&gt;1 變快，&lt;1 變慢）</li>
          <li><strong>4.15.3</strong>：影響程式變快或變慢的最主要因素為何？</li>
          <li><strong>4.15.4</strong>：綜合評估，原設計與新設計何者較佳？</li>
        </ol>
      `,
      numericChecks: [
        { label: "4.15.1 新最小時脈週期 (ps)", answer: 725, tolerance: 0, unit: "ps", placeholder: "例如：725" },
        { label: "4.15.2 新架構加速比 Speedup", answer: 0.94, tolerance: 0.015, unit: "x", placeholder: "例如：0.94" }
      ],
      solution: `
        <ul>
          <li><strong>4.15.1 新最小時脈週期（725 ps）</strong>：
            移除 ALU 後，<code>lw</code> 路徑改為 <code>PC(30) + I-Mem(250) + RegFile(150) + D-Mem(250) + MemtoReg Mux(25) + Reg Setup(20) = 725 ps</code>。
            與其他指令（<code>beq = 705 ps</code>、<code>R-type = 700 ps</code>）比較，<code>725 ps</code> 依然最長，故新時脈週期為 <strong>725 ps</strong>。
          </li>
          <li><strong>4.15.2 效能加速比（0.938x，變慢 6.2%）</strong>：
            每條 <code>lw</code>（25%）與 <code>sw</code>（11%）皆變成 2 條指令，故新指令數 $\\text{IC}_{\\text{new}} = (1 + 0.25 + 0.11)\\text{IC} = 1.36\\text{IC}$。
            $$\\text{Speedup} = \\frac{\\text{IC} \\times 925}{1.36 \\times \\text{IC} \\times 725} = \\frac{925}{986} \\approx \\mathbf{0.938\\times}$$
            （整體執行時間反而增加約 6.6%，效能退步！）
          </li>
          <li><strong>4.15.3 主要影響因素</strong>：程式中<strong>需要非零偏移量（non-zero offset）之 <code>lw/sw</code> 指令所佔的比例</strong>（若比例低於約 27.5%，縮短時脈的紅利才會大於指令數膨脹的代價）。</li>
          <li><strong>4.15.4 設計評析</strong>：<strong>原始設計（Figure 4.21）較佳</strong>。實務上陣列存取與堆疊變數存取（如 <code>lw $t0, 4($sp)</code>）高度依賴常數偏移量，移除偏移量會大幅膨脹程式碼體積（Code Size）與動態指令數，無法抵銷單週期時脈的降幅。</li>
        </ul>
      `
    }
  ];

  function renderTextbookLab(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let currentCat = "all";

    function renderAll() {
      const doneSet = getDoneSet();
      const filtered = currentCat === "all"
        ? exercises
        : exercises.filter(ex => ex.category === currentCat);

      const pct = Math.round((doneSet.size / exercises.length) * 100);

      let html = `
        <div class="card" style="margin-bottom: 1.5rem; border-left: 5px solid #38bdf8;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
            <div>
              <h2 class="card-title" style="color:#38bdf8; margin-bottom:0.25rem;">
                教科書 Chapter 4 單週期處理器課後習題實戰（Ex 4.1 ~ Ex 4.15）
              </h2>
              <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
                取材自 <em>Computer Organization and Design</em> §4.3 ~ §4.4 全套單週期習題（已對齊本課程 MIPS 架構，含數值自動批改與詳解推導）。
              </p>
            </div>
            <div style="min-width:220px; background:var(--bg-secondary); padding:0.75rem 1rem; border-radius:8px; border:1px solid var(--border-color);">
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.35rem;">
                <span style="color:var(--text-muted);">刷題完成進度</span>
                <strong style="color:#10b981;">${doneSet.size} / ${exercises.length} (${pct}%)</strong>
              </div>
              <div style="height:8px; background:var(--border-color); border-radius:999px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #38bdf8, #10b981); transition:width 0.3s;"></div>
              </div>
            </div>
          </div>

          <div class="filter-bar" id="ch4TextbookFilterBar" style="margin-bottom:0;">
            ${categories.map(c => `
              <button class="filter-btn ch4-tb-cat-btn ${c.id === currentCat ? "active" : ""}" data-cat="${c.id}">
                ${c.label}
              </button>
            `).join("")}
          </div>
        </div>
      `;

      filtered.forEach(ex => {
        const isDone = doneSet.has(ex.id);
        html += `
          <div class="card ch4-tb-card" id="card_${ex.id}" style="margin-bottom:1.25rem; border-left:4px solid ${isDone ? "#10b981" : "var(--border-color)"};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.85rem;">
              <div>
                <span class="badge badge-primary" style="margin-right:0.4rem;">${ex.num}</span>
                <span class="badge" style="background:rgba(148,163,184,0.15); color:var(--text-muted); margin-right:0.4rem;">${ex.section}</span>
                <span class="badge badge-warning">${ex.difficulty}</span>
                <h3 style="margin:0.45rem 0 0 0; font-size:1.1rem; color:var(--text-main);">${ex.title}</h3>
              </div>
              <button type="button" class="filter-btn ch4-tb-done-btn ${isDone ? "active" : ""}" data-id="${ex.id}" style="font-size:0.8rem; padding:0.3rem 0.7rem;">
                ${isDone ? "已完成（點擊取消）" : "標記已完成"}
              </button>
            </div>

            <div style="font-size:0.9rem; color:var(--text-main); line-height:1.7; margin-bottom:1rem;">
              ${ex.prompt}
            </div>
        `;

        if (ex.numericChecks && ex.numericChecks.length > 0) {
          html += `
            <div style="background:var(--bg-secondary); padding:1rem; border-radius:8px; border:1px solid var(--border-color); margin-bottom:0.9rem;">
              <div style="font-size:0.85rem; font-weight:700; color:#38bdf8; margin-bottom:0.65rem;">互動數值檢核區（輸入答案後點擊驗證）</div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:0.75rem;">
                ${ex.numericChecks.map((chk, idx) => `
                  <div style="display:flex; flex-direction:column; gap:0.3rem;">
                    <label style="font-size:0.8rem; color:var(--text-muted);">${chk.label}</label>
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                      <input type="text" class="answer-input ch4-tb-input" data-ex="${ex.id}" data-idx="${idx}" placeholder="${chk.placeholder || "輸入數值"}" style="flex:1; padding:0.45rem 0.65rem; font-size:0.88rem;">
                      ${chk.unit ? `<span style="font-size:0.82rem; color:var(--text-muted); font-family:var(--font-mono);">${chk.unit}</span>` : ""}
                    </div>
                    <div class="ch4-tb-msg" id="msg_${ex.id}_${idx}" style="font-size:0.78rem; min-height:1.1rem;"></div>
                  </div>
                `).join("")}
              </div>
              <div style="margin-top:0.75rem; display:flex; gap:0.6rem; flex-wrap:wrap;">
                <button type="button" class="action-btn btn-primary ch4-tb-grade-btn" data-id="${ex.id}" style="padding:0.45rem 1rem; font-size:0.86rem;">
                  驗證本題答案
                </button>
                <button type="button" class="action-btn ch4-tb-toggle-sol" data-id="${ex.id}" style="padding:0.45rem 1rem; font-size:0.86rem; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color);">
                  展開完整詳解
                </button>
              </div>
            </div>
          `;
        } else {
          html += `
            <div style="background:var(--bg-secondary); padding:0.9rem 1rem; border-radius:8px; border:1px solid var(--border-color); margin-bottom:0.9rem;">
              <label style="display:block; font-size:0.82rem; color:var(--text-muted); margin-bottom:0.4rem;">主動回憶作答草稿區（建議先寫出關鍵詞或推導邏輯，再展開詳解核對）：</label>
              <textarea rows="2" placeholder="在此記錄你的解題思路、受影響指令或需新增之控制訊號..." style="width:100%; background:var(--bg-primary); color:var(--text-main); border:1px solid var(--border-color); border-radius:6px; padding:0.55rem 0.75rem; font-size:0.86rem; font-family:var(--font-sans); resize:vertical;"></textarea>
              <div style="margin-top:0.65rem;">
                <button type="button" class="action-btn ch4-tb-toggle-sol" data-id="${ex.id}" style="padding:0.45rem 1rem; font-size:0.86rem; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color);">
                  展開完整詳解
                </button>
              </div>
            </div>
          `;
        }

        html += `
            <div id="sol_${ex.id}" style="display:none; background:var(--code-bg); padding:1.1rem 1.25rem; border-radius:8px; border:1px solid var(--border-color); font-size:0.88rem; line-height:1.75; color:var(--text-main);">
              <div style="font-weight:700; color:#10b981; margin-bottom:0.5rem;">標準詳解與考點剖析</div>
              ${ex.solution}
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      // 綁定分類切換
      container.querySelectorAll(".ch4-tb-cat-btn").forEach(btn => {
        btn.addEventListener("click", function() {
          currentCat = this.getAttribute("data-cat");
          renderAll();
        });
      });

      // 綁定完成標記
      container.querySelectorAll(".ch4-tb-done-btn").forEach(btn => {
        btn.addEventListener("click", function() {
          const id = this.getAttribute("data-id");
          const set = getDoneSet();
          if (set.has(id)) set.delete(id);
          else set.add(id);
          saveDoneSet(set);
          renderAll();
        });
      });

      // 綁定展開詳解
      container.querySelectorAll(".ch4-tb-toggle-sol").forEach(btn => {
        btn.addEventListener("click", function() {
          const id = this.getAttribute("data-id");
          const solEl = document.getElementById("sol_" + id);
          if (!solEl) return;
          const isOpen = solEl.style.display === "block";
          solEl.style.display = isOpen ? "none" : "block";
          this.textContent = isOpen ? "展開完整詳解" : "收合詳解";
          if (!isOpen && window.CO_SOLVER) window.CO_SOLVER.renderMath(solEl);
        });
      });

      // 綁定數值批改
      container.querySelectorAll(".ch4-tb-grade-btn").forEach(btn => {
        btn.addEventListener("click", function() {
          const id = this.getAttribute("data-id");
          const ex = exercises.find(e => e.id === id);
          if (!ex) return;

          let allCorrect = true;
          ex.numericChecks.forEach((chk, idx) => {
            const input = container.querySelector(`.ch4-tb-input[data-ex="${id}"][data-idx="${idx}"]`);
            const msg = document.getElementById(`msg_${id}_${idx}`);
            if (!input || !msg) return;

            const raw = input.value.trim().replace(/[%psx\s]/gi, "");
            const val = parseFloat(raw);
            if (isNaN(val)) {
              allCorrect = false;
              input.style.borderColor = "#f43f5e";
              msg.innerHTML = `<span style="color:#f43f5e;">請輸入有效數值</span>`;
            } else if (Math.abs(val - chk.answer) <= chk.tolerance) {
              input.style.borderColor = "#10b981";
              msg.innerHTML = `<span style="color:#10b981;">正確（標準答案：${chk.answer} ${chk.unit}）</span>`;
            } else {
              allCorrect = false;
              input.style.borderColor = "#f43f5e";
              msg.innerHTML = `<span style="color:#f43f5e;">有誤（參考答案：${chk.answer} ${chk.unit}）</span>`;
            }
          });

          if (allCorrect) {
            const set = getDoneSet();
            set.add(id);
            saveDoneSet(set);
          } else {
            const solEl = document.getElementById("sol_" + id);
            if (solEl) {
              solEl.style.display = "block";
              if (window.CO_SOLVER) window.CO_SOLVER.renderMath(solEl);
            }
          }
        });
      });

      if (window.CO_SOLVER) window.CO_SOLVER.renderMath(container);
    }

    renderAll();
  }

  return { renderTextbookLab };
})();
