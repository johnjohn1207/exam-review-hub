// Chapter 4: The Processor - Single Cycle Datapath and Control
// 國立中央大學 CO3020 計算機組織 期末考重點精華、完整公式手冊、真值表與動態計算題庫（資管跨修深度專業版）

window.CO_DATA = window.CO_DATA || { chapters: [], translations: [] };

// 移除既有的 ch4 (避免重複宣告)
window.CO_DATA.chapters = window.CO_DATA.chapters.filter(c => c.id !== "ch4");

window.CO_DATA.chapters.push({
  id: "ch4",
  title: "Chapter 4: 處理器設計與單週期微架構 (The Processor: Single-Cycle Datapath & Control)",
  shortTitle: "Ch4 單週期處理器",
  formulas: [
    {
      name: "CPU 執行時間方程式 (CPU Performance Equation)",
      formula: "\\text{CPU Execution Time} = \\text{Instruction Count} \\times \\text{CPI} \\times \\text{Clock Cycle Time}"
    },
    {
      name: "單週期時脈週期下限約束 (Single-Cycle Clock Period Constraint)",
      formula: "T_{\\text{clk}} \\ge T_{\\text{I-Mem}} + T_{\\text{RegRead}} + T_{\\text{ALU}} + T_{\\text{D-Mem}} + T_{\\text{RegWrite}} + T_{\\text{MUX}} + T_{\\text{setup}}"
    },
    {
      name: "時脈與建立時間約束 (Clock Period & Setup Time)",
      formula: "T_{\\text{clk}} \\ge T_{\\text{clk-to-q}} + T_{\\text{combinational, max}} + T_{\\text{setup}}"
    },
    {
      name: "保持時間無危害條件 (Hold Time Safety Condition)",
      formula: "T_{\\text{clk-to-q}} + T_{\\text{combinational, min}} \\ge T_{\\text{hold}}"
    },
    {
      name: "條件分支目標位址計算 (Branch Target Address)",
      formula: "\\text{Branch Target} = (PC + 4) + (\\text{SignExt}(\\text{immediate}_{16}) \\ll 2) = (PC + 4) + (\\text{immediate} \\times 4)"
    },
    {
      name: "無條件跳轉目標位址計算 (Jump Target Address)",
      formula: "\\text{Jump Target} = (PC + 4)[31:28] \\mathbin{\\Vert} (\\text{target}_{26} \\ll 2) = (PC + 4)[31:28] \\mathbin{\\Vert} (\\text{target}_{26} \\times 4)"
    },
    {
      name: "分支選通訊號 (Branch MUX Select / PCSrc)",
      formula: "\\text{PCSrc} = \\text{Branch} \\text{ AND } \\text{Zero} \\quad (\\text{針對 beq 指令})"
    }
  ],
  summary: [
    {
      heading: "1. 處理器組成、時序約束與單週期架構 (Overview & Clocking)",
      content: `
- **CPU 組成**：**Processor = Datapath（資料路徑）+ Control（控制單元）**。
- **元件分類**：
  - **組合元件（Combinational）**：無內部狀態，輸出僅由當前輸入決定（ALU、Adder、MUX、Sign-extend）。
  - **時序元件（Sequential / State）**：具儲存狀態，僅於**時脈正緣（Rising Clock Edge）**寫入（PC、Register File、Data Memory）。
- **物理時序約束**：
  - **Setup Time ($T_{\\text{setup}}$)**：時脈正緣前輸入資料須保持穩定之最短時間。
  - **Hold Time ($T_{\\text{hold}}$)**：時脈正緣後輸入資料須保持穩定之最短時間。
  - **時脈週期條件**：$T_{\\text{clk}} \\ge T_{\\text{clk-to-q}} + T_{\\text{combinational, max}} + T_{\\text{setup}}$。
- **單週期處理器特性**：$\\text{CPI} = 1$，但 $T_{\\text{clk}}$ 被最慢指令 \`lw\` 綁死，違反 Make the common case fast。
      `
    },
    {
      heading: "2. MIPS 指令格式、五大階段與四大多工器 (5 Stages & MUXes)",
      content: `
- **指令格式**：
  - **R-type**：\`op(6) | rs(5) | rt(5) | rd(5) | shamt(5) | funct(6)\`
  - **I-type**：\`op(6) | rs(5) | rt(5) | immediate(16)\`
  - **J-type**：\`op(6) | target(26)\`
- **五大階段**：**IF**（讀 I-Mem、算 $PC+4$）→ **ID**（讀暫存器 \`rs, rt\`、Sign-extend）→ **EX**（主 ALU 運算、Branch Adder 算跳轉位址）→ **MEM**（\`lw/sw\` 存取 D-Mem）→ **WB**（寫回 Register File）。
- **四大多工器選擇規則**：
  - **RegDst MUX**：\`0\` 選 \`rt\`（\`lw, addi\`）；\`1\` 選 \`rd\`（R-type）。
  - **ALUSrc MUX**：\`0\` 選 Read data 2（R-type, \`beq\`）；\`1\` 選 Sign-extended imm（\`lw, sw, addi\`）。
  - **MemtoReg MUX**：\`0\` 選 ALU Result；\`1\` 選 D-Mem Read data（僅 \`lw\`）。
  - **PCSrc MUX**：\`0\` 選 $PC+4$；\`1\` 選 Branch Target（當 $\\text{Branch} \\land \\text{Zero} = 1$）。
      `
    },
    {
      heading: "3. 雙層控制架構與 9 大控制訊號真值表 (Control & ALU Control)",
      content: `
- **雙層解碼目的**：降低主控制器邏輯複雜度與解碼延遲（Main Control 依 Opcode 輸出 2-bit \`ALUOp\`；ALU Control 結合 \`ALUOp\` 與 \`funct\` 輸出 4-bit ALU Control）。
- **ALU Control 對照表**：
  | 指令類別 | ALUOp | Funct (Hex) | ALU 運算 | ALU Control |
  | :--- | :---: | :---: | :--- | :---: |
  | \`lw\` / \`sw\` / \`addi\` | \`00\` | X | add | \`0010\` |
  | \`beq\` | \`01\` | X | subtract | \`0110\` |
  | \`add\` / \`sub\` / \`and\` / \`or\` / \`slt\` | \`10\` | \`0x20 / 22 / 24 / 25 / 2A\` | 對應運算 | \`0010 / 0110 / 0000 / 0001 / 0111\` |
- **主控制真值表**：
  | 指令 | Opcode | RegDst | ALUSrc | MemtoReg | RegWrite | MemRead | MemWrite | Branch | ALUOp |
  | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
  | **R-format** | \`000000\` | **1** | 0 | 0 | **1** | 0 | 0 | 0 | \`10\` |
  | **lw** | \`100011\` | 0 | **1** | **1** | **1** | **1** | 0 | 0 | \`00\` |
  | **sw** | \`101011\` | **X** | **1** | **X** | 0 | 0 | **1** | 0 | \`00\` |
  | **beq** | \`000100\` | **X** | 0 | **X** | 0 | 0 | 0 | **1** | \`01\` |
  | **addi** | \`001000\` | 0 | **1** | 0 | **1** | 0 | 0 | 0 | \`00\` |
  | **j** | \`000010\` | **X** | **X** | **X** | 0 | 0 | 0 | 0 | \`XX\` |
- **Don't Care (X) 原則**：\`RegWrite = 0\` 時寫入埠關閉，\`RegDst\` 與 \`MemtoReg\` 皆可標為 \`X\` 以化簡組合邏輯。
      `
    },
    {
      heading: "4. 目標位址合成、關鍵路徑與硬體故障分析 (Address, Timing & Faults)",
      content: `
- **位址左移 2 位原因**：MIPS 採 Byte 定址，每指令佔 4 Bytes（1 Word），欄位存 Word 數故須乘 4（\`<< 2\`）。
  - **beq**：$(PC + 4) + (\\text{SignExt}(\\text{offset}_{16}) \\ll 2)$
  - **j**：$(PC + 4)[31:28] \\mathbin{\\Vert} (\\text{target}_{26} \\ll 2)$
- **關鍵路徑延遲**：\`lw\` 最長。注意並行遮蔽效應（Ex 4.7）：若 $T_{\\text{RegRead}} > T_{\\text{SignExt}} + T_{\\text{MUX}}$，則 ALUSrc MUX 不在 \`lw / sw / addi\` 的關鍵路徑上。
- **Stuck-at Fault（卡死故障）速查表**：
  | 故障訊號 | 受影響失效指令 | 錯誤行為 |
  | :--- | :--- | :--- |
  | **RegWrite = 0** | \`R-type, lw, addi\` | 無法寫入暫存器 |
  | **RegWrite = 1** | \`sw, beq, j\` | 誤覆寫暫存器 |
  | **ALUSrc = 0** | \`lw, sw, addi\` | 無法使用立即值／偏移量 |
  | **ALUSrc = 1** | \`R-type, beq\` | 忽略暫存器 \`rt\`，誤用立即值 |
  | **MemRead = 0** | \`lw\` | 無法讀取記憶體資料 |
  | **MemWrite = 0** | \`sw\` | 無法寫入記憶體 |
  | **MemtoReg = 0** | \`lw\` | 誤將記憶體位址寫回暫存器 |
  | **Branch = 1** | 結果為 0 之指令（如 \`sub $t0,$t0,$t0\`） | Zero=1 時誤觸發跳轉 |
      `
    },
    {
      heading: "5. 新指令擴充設計 SOP 與經典題型 (ISA Extensions)",
      content: `
- **擴充四步驟**：1. 寫出 RTL 語意 → 2. 檢查缺少的硬體埠或通路 → 3. 擴充 MUX（2-to-1 → 3-to-1）與拉線 → 4. 定義控制訊號。
- **\`jal\`**（$PC \\leftarrow \\text{JumpTarget};\\ R[31] \\leftarrow PC+4$）：RegDst MUX 擴充輸入 \`31\`、MemtoReg MUX 擴充輸入 \`PC+4\`，設 \`RegWrite=1, Jump=1\`。
- **\`jr $rs\`**（$PC \\leftarrow R[rs]$）：Jump MUX 後新增 MUX（或擴充 3-to-1）接入 Read data 1，新增控制訊號 \`JumpReg\`，\`RegWrite=0, MemWrite=0\`。
- **\`bne\`**（$R[rs] \\ne R[rt]$ 跳轉）：AND 閘改接 $\\overline{\\text{Zero}}$，或以 XOR 閘整合：$\\text{PCSrc} = \\text{Branch} \\land (\\text{Zero} \\oplus \\text{BranchType})$。
      `
    }
  ],
  dynamicProblems: [
    {
      id: "ch4_critpath_calc",
      title: "題型 4-1：處理器關鍵路徑延遲與時鐘週期下限計算",
      category: "Critical Path 延遲分析",
      generator: function() {
        const memDelay = (Math.floor(Math.random() * 3) + 3) * 50; // 150, 200, 250 ps
        const regDelay = (Math.floor(Math.random() * 2) + 1) * 20 + 20; // 40, 60 ps
        const aluDelay = (Math.floor(Math.random() * 3) + 2) * 40; // 80, 120, 160 ps
        const muxDelay = 10;

        return { memDelay, regDelay, aluDelay, muxDelay };
      },
      render: function(p) {
        return `考慮一個單週期 MIPS 處理器，各硬體功能區塊之傳播延遲如下：
- **Instruction Memory (指令記憶體)**：**${p.memDelay} ps**
- **Data Memory (資料記憶體讀寫)**：**${p.memDelay} ps**
- **Register File 讀取**：**${p.regDelay} ps**，**Register File 寫入**：**${p.regDelay} ps**
- **主 ALU 與各專用加法器 (Adder)**：**${p.aluDelay} ps**
- **多工器 (MUX)**：**${p.muxDelay} ps**
- 控制單元與導線延遲忽略不計。

**請計算：此單週期處理器能正常運作所需的「最小時脈週期（Minimum Clock Cycle Time）」為多少 ps？**
（提示：時脈週期必須由整體微架構中最長的關鍵路徑 Critical Path 決定）`;
      },
      solve: function(p) {
        const tLw = p.memDelay + p.regDelay + p.aluDelay + p.memDelay + p.muxDelay + p.regDelay;
        const tR = p.memDelay + p.regDelay + p.aluDelay + p.muxDelay + p.regDelay;
        const tSw = p.memDelay + p.regDelay + p.aluDelay + p.memDelay;
        const tBeq = p.memDelay + p.regDelay + p.aluDelay + p.muxDelay;

        return {
          correctValue: tLw,
          unit: "ps",
          tolerance: 0,
          explanation: `
1. **各主要指令路徑延遲詳解**：
   - **lw (載入指令)**：
     $$\\text{Delay}_{lw} = T_{\\text{I-Mem}} + T_{\\text{RegRead}} + T_{\\text{ALU}} + T_{\\text{D-Mem}} + T_{\\text{MUX}} + T_{\\text{RegWrite}}$$
     $$= ${p.memDelay} + ${p.regDelay} + ${p.aluDelay} + ${p.memDelay} + ${p.muxDelay} + ${p.regDelay} = \\mathbf{${tLw}\\text{ ps}}$$
   - **sw (儲存指令)**：
     $$\\text{Delay}_{sw} = ${p.memDelay} + ${p.regDelay} + ${p.aluDelay} + ${p.memDelay} = ${tSw}\\text{ ps}$$
   - **R-type (算術運算)**：
     $$\\text{Delay}_R = ${p.memDelay} + ${p.regDelay} + ${p.aluDelay} + ${p.muxDelay} + ${p.regDelay} = ${tR}\\text{ ps}$$
   - **beq (條件分支)**：
     $$\\text{Delay}_{beq} = ${p.memDelay} + ${p.regDelay} + ${p.aluDelay} + ${p.muxDelay} = ${tBeq}\\text{ ps}$$
2. **最小時脈週期決定**：
   單週期微架構中，所有指令必須在單一時鐘週期內完成，因此週期長度取決於**耗時最長的指令（Critical Path）**，即 **lw 指令**：
   $$T_{\\text{clk}} \\ge \\mathbf{${tLw}\\text{ ps}}$$
          `
        };
      }
    },
    {
      id: "ch4_branch_target",
      title: "題型 4-2：條件分支 (beq) 跳轉目標位址動態計算",
      category: "分支位址合成",
      generator: function() {
        const pcBase = 0x00400000 + Math.floor(Math.random() * 40) * 4;
        const offsetWords = Math.floor(Math.random() * 15) - 6; // -6 ~ +8 words
        return { pcBase, offsetWords };
      },
      render: function(p) {
        const pcHex = "0x" + p.pcBase.toString(16).padStart(8, "0");
        return `在 MIPS 單週期處理器中，條件分支指令 <code>beq $s0, $s1, Target</code> 存放在記憶體位址 **${pcHex}**。
若組譯器解碼後，該指令內部的 16 位元立即值（Immediate offset）欄位數值為 **${p.offsetWords}**（以 Word 為單位）。

**請計算：當分支條件成立（Branch Taken）時，寫入 PC 的最終目標位址為何？**
（請輸入 8 位十六進位格式，如 0x00400010 或 00400010）`;
      },
      solve: function(p) {
        const pcNext = p.pcBase + 4;
        const target = pcNext + (p.offsetWords * 4);
        const targetHex = "0x" + (target >>> 0).toString(16).padStart(8, "0");

        return {
          correctValue: targetHex,
          unit: "",
          tolerance: 0,
          explanation: `
1. **取得下一條循序指令位址 (PC + 4)**：
   $$PC + 4 = \\text{0x}${p.pcBase.toString(16).padStart(8, "0")} + 4 = \\text{0x}${pcNext.toString(16).padStart(8, "0")}$$
2. **換算立即值位移 Byte 量**：
   指令中的 offset 為 Word 數，必須向左位移 2 位（乘以 4）：
   $$\\text{Byte Offset} = ${p.offsetWords} \\times 4 = ${p.offsetWords * 4}\\text{ Bytes}$$
3. **計算最終分支目標位址 (Branch Target)**：
   $$\\text{Target} = (PC + 4) + (\\text{offset} \\times 4) = ${pcNext} + (${p.offsetWords * 4}) = \\mathbf{${targetHex}}$$
          `
        };
      }
    },
    {
      id: "ch4_signal_deduce",
      title: "題型 4-3：控制訊號逆向解碼與硬體邏輯判定",
      category: "控制單元解碼",
      generator: function() {
        const items = [
          { name: "lw", targetSig: "MemtoReg", answer: 1, reason: "只有 lw 指令會將資料記憶體讀出的資料寫回暫存器，故 MemtoReg 必為 1" },
          { name: "sw", targetSig: "MemWrite", answer: 1, reason: "sw 指令執行記憶體寫入，MemWrite 設為 1，RegWrite 設為 0" },
          { name: "R-type (add/sub)", targetSig: "RegDst", answer: 1, reason: "R-type 指令之目的暫存器為 rd (Bits 15:11)，故 RegDst 設為 1" },
          { name: "beq", targetSig: "Branch", answer: 1, reason: "beq 為條件分支指令，主控制器將 Branch 設為 1" },
          { name: "addi", targetSig: "ALUSrc", answer: 1, reason: "addi 指令之第二運算元為立即值，故 ALUSrc 設為 1" }
        ];
        const pick = items[Math.floor(Math.random() * items.length)];
        return { pick };
      },
      render: function(p) {
        return `在標準 MIPS 單週期處理器中，當處理器正在執行 **${p.pick.name}** 指令時：

**請問控制訊號 「${p.pick.targetSig}」 的設定值應為多少？**（請輸入 0 或 1）`;
      },
      solve: function(p) {
        return {
          correctValue: p.pick.answer,
          unit: "",
          tolerance: 0,
          explanation: `
• **指令類別**：${p.pick.name}<br>
• **目標訊號**：${p.pick.targetSig} = **${p.pick.answer}**<br>
• **硬體原理解析**：${p.pick.reason}。
          `
        };
      }
    },
    {
      id: "ch4_textbook_4_3_mix",
      title: "題型 4-4（教科書 Ex 4.3 變種）：指令混合比例與硬體單元使用率計算",
      category: "教科書 Ex 4.3 變種",
      generator: function() {
        const rType = 20 + Math.floor(Math.random() * 11); // 20..30
        const iArith = 20 + Math.floor(Math.random() * 11); // 20..30
        const lw = 18 + Math.floor(Math.random() * 10); // 18..27
        const sw = 8 + Math.floor(Math.random() * 7); // 8..14
        const jType = 2 + Math.floor(Math.random() * 4); // 2..5
        const beq = 100 - (rType + iArith + lw + sw + jType);
        const targets = ["dmem", "signext"];
        const target = targets[Math.floor(Math.random() * targets.length)];
        return { rType, iArith, lw, sw, beq, jType, target };
      },
      render: function(p) {
        const qText = p.target === "dmem"
          ? "**Data Memory（資料記憶體）**"
          : "**Sign-Extend（符號延展單元）**";
        return `仿照教科書 Exercise 4.3，假設某程式在單週期 MIPS 處理器上的指令混合比例如下：
- **R-type**：${p.rType}%、**I-type (non-lw，如 addi)**：${p.iArith}%
- **Load (lw)**：${p.lw}%、**Store (sw)**：${p.sw}%
- **Branch (beq)**：${p.beq}%、**Jump (j)**：${p.jType}%

**請問：所有指令中，實際有使用到 ${qText} 輸出的指令佔多少百分比（%）？**（輸入數字即可，例如 35）`;
      },
      solve: function(p) {
        if (p.target === "dmem") {
          const ans = p.lw + p.sw;
          return {
            correctValue: ans,
            unit: "%",
            tolerance: 0.1,
            explanation: `
1. 僅 **Load (lw)** 與 **Store (sw)** 會存取 Data Memory：
   $$\\text{Data Memory 使用率} = ${p.lw}\\% + ${p.sw}\\% = \\mathbf{${ans}\\%}$$
            `
          };
        } else {
          const ans = p.iArith + p.lw + p.sw + p.beq;
          return {
            correctValue: ans,
            unit: "%",
            tolerance: 0.1,
            explanation: `
1. 除了 **R-type**（無立即值）與 **Jump**（26 位元目標位址直接左移 2 位）之外，其餘 I-type 指令皆使用 Sign-Extend：
   $$\\text{Sign-Extend 使用率} = ${p.iArith}\\% + ${p.lw}\\% + ${p.sw}\\% + ${p.beq}\\% = \\mathbf{${ans}\\%}$$
   （亦可速算：$100\\% - ${p.rType}\\% - ${p.jType}\\% = ${ans}\\%$）
            `
          };
        }
      }
    },
    {
      id: "ch4_textbook_4_7_trap",
      title: "題型 4-5（教科書 Ex 4.7 變種）：含 clk-to-q 與 Setup Time 之 lw 關鍵路徑精算",
      category: "教科書 Ex 4.7 變種",
      generator: function() {
        const pcRead = [20, 30, 40][Math.floor(Math.random() * 3)];
        const mem = [200, 250, 300][Math.floor(Math.random() * 3)];
        const regFile = [120, 150, 180][Math.floor(Math.random() * 3)];
        const mux = [20, 25, 30][Math.floor(Math.random() * 3)];
        const alu = [180, 200, 220][Math.floor(Math.random() * 3)];
        const signExt = 50;
        const setup = [15, 20, 25][Math.floor(Math.random() * 3)];
        return { pcRead, mem, regFile, mux, alu, signExt, setup };
      },
      render: function(p) {
        return `仿照教科書 Exercise 4.7，單週期處理器各元件延遲如下（單位：ps）：
- **PC Reg Read (clk-to-q)**：${p.pcRead} ps、**Register Setup Time**：${p.setup} ps
- **I-Mem / D-Mem**：${p.mem} ps、**Register File Read**：${p.regFile} ps
- **ALU**：${p.alu} ps、**MUX**：${p.mux} ps、**Sign-Extend**：${p.signExt} ps

**請精算 <code>lw</code> 指令之最小時脈週期（ps）？**
（陷阱提醒：請比較 <code>RegFile Read</code> 與 <code>Sign-Extend + ALUSrc MUX</code> 兩條並行路徑，切勿重複計入非關鍵路徑上的 MUX！）`;
      },
      solve: function(p) {
        const immPath = p.signExt + p.mux;
        const beforeAlu = Math.max(p.regFile, immPath);
        const ans = p.pcRead + p.mem + beforeAlu + p.alu + p.mem + p.mux + p.setup;
        return {
          correctValue: ans,
          unit: "ps",
          tolerance: 0,
          explanation: `
1. **比較進入 ALU 前的兩條並行路徑**：
   - 路徑 A（Register File 讀取直入 ALU）：$${p.regFile}\\text{ ps}$
   - 路徑 B（Sign-Extend + ALUSrc MUX）：$${p.signExt} + ${p.mux} = ${immPath}\\text{ ps}$
   - 因 $${p.regFile} > ${immPath}$，**ALUSrc MUX 不在 lw 關鍵路徑上**！
2. **加總關鍵路徑延遲**：
   $$T_{lw} = T_{\\text{PC}} + T_{\\text{I-Mem}} + T_{\\text{RegFile}} + T_{\\text{ALU}} + T_{\\text{D-Mem}} + T_{\\text{MemtoReg MUX}} + T_{\\text{setup}}$$
   $$= ${p.pcRead} + ${p.mem} + ${beforeAlu} + ${p.alu} + ${p.mem} + ${p.mux} + ${p.setup} = \\mathbf{${ans}\\text{ ps}}$$
          `
        };
      }
    },
    {
      id: "ch4_textbook_4_9_tradeoff",
      title: "題型 4-6（教科書 Ex 4.9 變種）：硬體擴充之時脈週期與加速比權衡",
      category: "教科書 Ex 4.9 變種",
      generator: function() {
        const baseClk = [800, 900, 925, 1000][Math.floor(Math.random() * 4)];
        const addDelay = [150, 200, 250, 300][Math.floor(Math.random() * 4)];
        const icReducePct = [5, 10, 15, 20][Math.floor(Math.random() * 4)];
        return { baseClk, addDelay, icReducePct };
      },
      render: function(p) {
        return `仿照教科書 Exercise 4.9，原單週期處理器之時脈週期為 **${p.baseClk} ps**。
若在 ALU 關鍵路徑上新增一硬體加速模組，會使單週期時脈週期**增加 ${p.addDelay} ps**，但能使總執行指令數（IC）**減少 ${p.icReducePct}%**。

**請計算：加入此改進後的加速比（Speedup）為何？**（四捨五入至小數點後兩位，例如 0.85 或 1.05）`;
      },
      solve: function(p) {
        const newClk = p.baseClk + p.addDelay;
        const icFactor = (100 - p.icReducePct) / 100;
        const speedup = p.baseClk / (icFactor * newClk);
        const rounded = Math.round(speedup * 100) / 100;
        return {
          correctValue: rounded,
          unit: "x",
          tolerance: 0.015,
          explanation: `
1. **新時脈週期**：$T_{\\text{new}} = ${p.baseClk} + ${p.addDelay} = ${newClk}\\text{ ps}$
2. **新指令數比例**：$\\text{IC}_{\\text{new}} = (1 - ${p.icReducePct}\\%) \\times \\text{IC} = ${icFactor.toFixed(2)}\\,\\text{IC}$
3. **加速比（Speedup）**：
   $$\\text{Speedup} = \\frac{\\text{IC} \\times ${p.baseClk}}{${icFactor.toFixed(2)}\\,\\text{IC} \\times ${newClk}} = \\frac{${p.baseClk}}{${(icFactor * newClk).toFixed(2)}} \\approx \\mathbf{${rounded}\\times}$$
   （${rounded >= 1 ? "大於 1，整體效能提升" : "小於 1，整體效能反而變慢"}）
          `
        };
      }
    }
  ]
});
