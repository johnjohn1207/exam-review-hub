// Chapter 4: 單週期處理器資料路徑與控制訊號互動實驗室 (Ch4 Datapath & Control Interactive Lab)
// 支援指令即時切換、9 大控制訊號高亮、課堂 Exercise 4 大真題、以及全真變種抽題作答特訓引擎

window.CO_CH4_LAB = (function() {

  // 1. 靜態指令展示字典
  const instructions = {
    "r_add": {
      name: "add $rd, $rs, $rt",
      type: "R-type",
      opcode: "000000 (0x00)",
      funct: "100000 (0x20)",
      signals: {
        RegDst: { val: "1", note: "選通 rd (Bits 15:11) 作為目的暫存器" },
        ALUSrc: { val: "0", note: "選通暫存器 Read data 2 (rt) 作為 ALU 第二運算元" },
        MemtoReg: { val: "0", note: "選通 ALU Result 寫回暫存器" },
        RegWrite: { val: "1", note: "致能暫存器寫入 (寫入 rd)" },
        MemRead: { val: "0", note: "禁止記憶體讀取" },
        MemWrite: { val: "0", note: "禁止記憶體寫入" },
        Branch: { val: "0", note: "非分支指令" },
        ALUOp: { val: "10", note: "通知 ALU Control 解碼 funct 欄位" },
        Jump: { val: "0", note: "非跳轉指令" }
      },
      aluControl: { code: "0010", op: "add (加法)" },
      muxes: {
        RegDstMUX: "1 (rd)",
        ALUSrcMUX: "0 (Read data 2)",
        MemtoRegMUX: "0 (ALU Result)",
        PCSrcMUX: "0 (PC + 4)",
        JumpMUX: "0 (PCSrc 輸出)"
      },
      pathDescription: "PC &rarr; Instruction Memory &rarr; Register File 讀取 (rs, rt) &rarr; ALU (加法 R[rs]+R[rt]) &rarr; MemtoReg MUX &rarr; Register File 寫入 (rd)。",
      latencyFormula: "T = T_IMem + T_RegRead + T_ALU + T_RegWrite",
      examExercise: null
    },
    "r_sub": {
      name: "sub $rd, $rs, $rt",
      type: "R-type",
      opcode: "000000 (0x00)",
      funct: "100010 (0x22)",
      signals: {
        RegDst: { val: "1", note: "選通 rd (Bits 15:11) 作為目的暫存器" },
        ALUSrc: { val: "0", note: "選通暫存器 Read data 2 (rt) 作為 ALU 第二運算元" },
        MemtoReg: { val: "0", note: "選通 ALU Result 寫回暫存器" },
        RegWrite: { val: "1", note: "致能暫存器寫入 (寫入 rd)" },
        MemRead: { val: "0", note: "禁止記憶體讀取" },
        MemWrite: { val: "0", note: "禁止記憶體寫入" },
        Branch: { val: "0", note: "非分支指令" },
        ALUOp: { val: "10", note: "通知 ALU Control 解碼 funct 欄位" },
        Jump: { val: "0", note: "非跳轉指令" }
      },
      aluControl: { code: "0110", op: "subtract (減法)" },
      muxes: {
        RegDstMUX: "1 (rd)",
        ALUSrcMUX: "0 (Read data 2)",
        MemtoRegMUX: "0 (ALU Result)",
        PCSrcMUX: "0 (PC + 4)",
        JumpMUX: "0 (PCSrc 輸出)"
      },
      pathDescription: "PC &rarr; Instruction Memory &rarr; Register File 讀取 (rs, rt) &rarr; ALU (減法 R[rs]-R[rt]) &rarr; MemtoReg MUX &rarr; Register File 寫入 (rd)。",
      latencyFormula: "T = T_IMem + T_RegRead + T_ALU + T_RegWrite",
      examExercise: null
    },
    "lw": {
      name: "lw $t1, 8($s2)",
      type: "I-type (Load Word)",
      opcode: "100011 (0x23 / 35)",
      funct: "無 (立即值 offset = 8)",
      signals: {
        RegDst: { val: "0", note: "選通 rt (Bits 20:16) 作為目的暫存器 ($t1)" },
        ALUSrc: { val: "1", note: "選通 16 位元符號延展立即值 (8) 作為 ALU 第二輸入" },
        MemtoReg: { val: "1", note: "選通 Data Memory Read data 寫回暫存器" },
        RegWrite: { val: "1", note: "致能暫存器寫入 (於時脈正緣將記憶體讀出值寫入 $t1)" },
        MemRead: { val: "1", note: "致能 Data Memory 讀取" },
        MemWrite: { val: "0", note: "禁止記憶體寫入" },
        Branch: { val: "0", note: "非分支指令" },
        ALUOp: { val: "00", note: "強制 ALU 執行加法運算 (計算記憶體位址)" },
        Jump: { val: "0", note: "非跳轉指令" }
      },
      aluControl: { code: "0010", op: "add (計算 Effective Address = R[$s2] + 8)" },
      muxes: {
        RegDstMUX: "0 (rt: $t1)",
        ALUSrcMUX: "1 (Sign-extended immediate 8)",
        MemtoRegMUX: "1 (Data Memory Read Data)",
        PCSrcMUX: "0 (PC + 4)",
        JumpMUX: "0 (PCSrc 輸出)"
      },
      pathDescription: "【關鍵路徑 Critical Path】PC &rarr; Instruction Memory &rarr; Register File 讀取 ($s2) &rarr; ALU (R[$s2] + 8) &rarr; Data Memory 讀取 &rarr; MemtoReg MUX &rarr; Register File 寫入 ($t1)。",
      latencyFormula: "T = T_IMem + T_RegRead + T_ALU + T_DMem + T_MUX + T_RegWrite (耗時最長指令！)",
      examExercise: "課堂 Exercise 題目 1 原型"
    },
    "sw": {
      name: "sw $t1, 8($s2)",
      type: "I-type (Store Word)",
      opcode: "101011 (0x2B / 43)",
      funct: "無 (立即值 offset = 8)",
      signals: {
        RegDst: { val: "X", note: "Don't Care (RegWrite=0，暫存器不寫入，選通何者皆無影響)" },
        ALUSrc: { val: "1", note: "選通 16 位元符號延展立即值 (8) 作為 ALU 第二輸入" },
        MemtoReg: { val: "X", note: "Don't Care (RegWrite=0，不寫回暫存器)" },
        RegWrite: { val: "0", note: "禁止暫存器寫入" },
        MemRead: { val: "0", note: "禁止記憶體讀取" },
        MemWrite: { val: "1", note: "致能 Data Memory 寫入 (於時脈正緣將 R[$t1] 寫入位址)" },
        Branch: { val: "0", note: "非分支指令" },
        ALUOp: { val: "00", note: "強制 ALU 執行加法運算 (計算記憶體位址)" },
        Jump: { val: "0", note: "非跳轉指令" }
      },
      aluControl: { code: "0010", op: "add (計算 Effective Address = R[$s2] + 8)" },
      muxes: {
        RegDstMUX: "X (Don't Care)",
        ALUSrcMUX: "1 (Sign-extended immediate 8)",
        MemtoRegMUX: "X (Don't Care)",
        PCSrcMUX: "0 (PC + 4)",
        JumpMUX: "0 (PCSrc 輸出)"
      },
      pathDescription: "PC &rarr; Instruction Memory &rarr; Register File 讀取 (rs=$s2, rt=$t1) &rarr; ALU (計算位址 R[$s2] + 8) &rarr; Data Memory 寫入輸入端 (將 R[$t1] 寫入該位址)。",
      latencyFormula: "T = T_IMem + T_RegRead + T_ALU + T_DMem",
      examExercise: "課堂 Exercise 題目 2 原型"
    },
    "beq_not_taken": {
      name: "beq $t1, $t2, Label (Branch NOT Taken, R[$t1] != R[$t2])",
      type: "I-type (Branch on Equal - 不跳轉)",
      opcode: "000100 (0x04 / 4)",
      funct: "無 (16-bit offset)",
      signals: {
        RegDst: { val: "X", note: "Don't Care (不寫入暫存器)" },
        ALUSrc: { val: "0", note: "選通暫存器 Read data 2 ($t2) 作為 ALU 第二運算元" },
        MemtoReg: { val: "X", note: "Don't Care (不寫回暫存器)" },
        RegWrite: { val: "0", note: "禁止暫存器寫入" },
        MemRead: { val: "0", note: "禁止記憶體讀取" },
        MemWrite: { val: "0", note: "禁止記憶體寫入" },
        Branch: { val: "1", note: "致能分支邏輯 (但因 Zero=0，PCSrc = 1 AND 0 = 0)" },
        ALUOp: { val: "01", note: "強制 ALU 執行減法運算 (判斷相等性)" },
        Jump: { val: "0", note: "非跳轉指令" }
      },
      aluControl: { code: "0110", op: "subtract (減法 $t1 - $t2，結果 != 0 故 Zero = 0)" },
      muxes: {
        RegDstMUX: "X (Don't Care)",
        ALUSrcMUX: "0 (Read data 2: $t2)",
        MemtoRegMUX: "X (Don't Care)",
        PCSrcMUX: "0 (選通 PC + 4，因 Branch AND Zero = 0)",
        JumpMUX: "0 (PCSrc 輸出: PC + 4)"
      },
      pathDescription: "PC &rarr; Instruction Memory &rarr; Register File 讀取 ($t1, $t2) &rarr; ALU 減法 (Zero=0) &rarr; PCSrc=0 &rarr; PC 載入 PC+4 (循序前進)。",
      latencyFormula: "T = T_IMem + T_RegRead + T_ALU + T_PCSrcMUX",
      examExercise: "課堂 Exercise 題目 3 原型 (P53 指定 Not Taken)"
    },
    "beq_taken": {
      name: "beq $t1, $t2, Label (Branch Taken, R[$t1] == R[$t2])",
      type: "I-type (Branch on Equal - 跳轉成立)",
      opcode: "000100 (0x04 / 4)",
      funct: "無 (16-bit offset)",
      signals: {
        RegDst: { val: "X", note: "Don't Care (不寫入暫存器)" },
        ALUSrc: { val: "0", note: "選通暫存器 Read data 2 ($t2) 作為 ALU 第二運算元" },
        MemtoReg: { val: "X", note: "Don't Care (不寫回暫存器)" },
        RegWrite: { val: "0", note: "禁止暫存器寫入" },
        MemRead: { val: "0", note: "禁止記憶體讀取" },
        MemWrite: { val: "0", note: "禁止記憶體寫入" },
        Branch: { val: "1", note: "致能分支邏輯 (因 Zero=1，PCSrc = 1 AND 1 = 1)" },
        ALUOp: { val: "01", note: "強制 ALU 執行減法運算" },
        Jump: { val: "0", note: "非跳轉指令" }
      },
      aluControl: { code: "0110", op: "subtract (減法 $t1 - $t2 = 0 故 Zero = 1)" },
      muxes: {
        RegDstMUX: "X (Don't Care)",
        ALUSrcMUX: "0 (Read data 2: $t2)",
        MemtoRegMUX: "X (Don't Care)",
        PCSrcMUX: "1 (選通 Branch Target = (PC+4) + (offset << 2))",
        JumpMUX: "0 (PCSrc 輸出: Branch Target)"
      },
      pathDescription: "同時執行：1. ALU 減法得到 Zero=1；2. 專用加法器計算 (PC+4)+(offset<<2)；3. PCSrc=1 &rarr; PC 載入分支目標位址。",
      latencyFormula: "T = max(T_BranchAdder, T_IMem + T_RegRead + T_ALU) + T_MUX",
      examExercise: "課堂 Exercise 題目 3 延伸 (Taken 情況)"
    },
    "addi": {
      name: "addi $t1, $t2, 5",
      type: "I-type (Add Immediate)",
      opcode: "001000 (0x08 / 8)",
      funct: "無 (16-bit immediate = 5)",
      signals: {
        RegDst: { val: "0", note: "選通 rt (Bits 20:16) 作為目的暫存器 ($t1)" },
        ALUSrc: { val: "1", note: "選通 16 位元符號延展立即值 (5) 作為 ALU 第二輸入" },
        MemtoReg: { val: "0", note: "選通 ALU Result 寫回暫存器" },
        RegWrite: { val: "1", note: "致能暫存器寫入 (將運算結果寫入 $t1)" },
        MemRead: { val: "0", note: "禁止記憶體讀取" },
        MemWrite: { val: "0", note: "禁止記憶體寫入" },
        Branch: { val: "0", note: "非分支指令" },
        ALUOp: { val: "00", note: "強制 ALU 執行加法運算 (或自訂立即加法)" },
        Jump: { val: "0", note: "非跳轉指令" }
      },
      aluControl: { code: "0010", op: "add (加法 R[$t2] + 5)" },
      muxes: {
        RegDstMUX: "0 (rt: $t1)",
        ALUSrcMUX: "1 (Sign-extended immediate 5)",
        MemtoRegMUX: "0 (ALU Result)",
        PCSrcMUX: "0 (PC + 4)",
        JumpMUX: "0 (PCSrc 輸出)"
      },
      pathDescription: "PC &rarr; Instruction Memory &rarr; Register File 讀取 ($t2) &rarr; ALU (R[$t2] + 5) &rarr; MemtoReg MUX (選通 0) &rarr; Register File 寫入 ($t1)。",
      latencyFormula: "T = T_IMem + T_RegRead + T_ALU + T_MUX + T_RegWrite",
      examExercise: "課堂 Exercise 題目 0 原型"
    },
    "jump": {
      name: "j Target_Address",
      type: "J-type (Jump)",
      opcode: "000010 (0x02 / 2)",
      funct: "無 (26-bit target address)",
      signals: {
        RegDst: { val: "X", note: "Don't Care (不寫入暫存器)" },
        ALUSrc: { val: "X", note: "Don't Care (不使用主 ALU 運算結果)" },
        MemtoReg: { val: "X", note: "Don't Care (不寫回暫存器)" },
        RegWrite: { val: "0", note: "禁止暫存器寫入" },
        MemRead: { val: "0", note: "禁止記憶體讀取" },
        MemWrite: { val: "0", note: "禁止記憶體寫入" },
        Branch: { val: "0", note: "非條件分支指令" },
        ALUOp: { val: "XX", note: "Don't Care" },
        Jump: { val: "1", note: "致能 Jump MUX，強制將跳轉位址載入 PC" }
      },
      aluControl: { code: "XXXX", op: "Don't Care" },
      muxes: {
        RegDstMUX: "X (Don't Care)",
        ALUSrcMUX: "X (Don't Care)",
        MemtoRegMUX: "X (Don't Care)",
        PCSrcMUX: "0 (PC + 4)",
        JumpMUX: "1 (Jump Target = (PC+4)[31:28] || (target << 2))"
      },
      pathDescription: "PC &rarr; Instruction Memory &rarr; 取 target[25:0] 左移 2 位 &rarr; 與 (PC+4)[31:28] 串接 &rarr; Jump MUX &rarr; 寫入 PC。",
      latencyFormula: "T = T_IMem + T_ShiftLeft2 + T_JumpMUX",
      examExercise: "投影片第 46-47 頁跳轉擴充微架構"
    }
  };

  // 1.5 完整單週期資料路徑互動大圖（SVG 螢光筆高亮引擎）
  let dpDimInactive = true;
  let dpAnimateFlow = true;

  const datapathProfiles = {
    r_add: {
      blocks: ["pc", "imem", "add_pc4", "control", "mux_regdst", "registers", "mux_alusrc", "alu", "alu_ctrl", "mux_memtoreg", "mux_pcsrc", "mux_jump"],
      dataWires: [
        "pc_to_imem", "pc_to_add4", "const4_to_add4", "add4_to_pcsrc0", "pcsrc_to_jump0", "jump_mux_to_pc",
        "imem_to_bus", "bus_to_ctrl", "bus_to_rs", "bus_to_rt", "bus_to_rd", "regdst_to_reg",
        "reg_rd1_to_alu", "reg_rd2_to_alusrc0", "alusrc_to_alu",
        "bus_to_imm_base", "bus_to_funct", "aluctrl_to_alu",
        "alu_to_memtoreg0", "memtoreg_to_reg"
      ],
      ctrlWires: ["ctrl_regdst", "ctrl_regwrite", "ctrl_aluop", "ctrl_alusrc", "ctrl_memtoreg"],
      muxSel: { regdst: "1", alusrc: "0", memtoreg: "0", pcsrc: "0", jump: "0" }
    },
    r_sub: {
      blocks: ["pc", "imem", "add_pc4", "control", "mux_regdst", "registers", "mux_alusrc", "alu", "alu_ctrl", "mux_memtoreg", "mux_pcsrc", "mux_jump"],
      dataWires: [
        "pc_to_imem", "pc_to_add4", "const4_to_add4", "add4_to_pcsrc0", "pcsrc_to_jump0", "jump_mux_to_pc",
        "imem_to_bus", "bus_to_ctrl", "bus_to_rs", "bus_to_rt", "bus_to_rd", "regdst_to_reg",
        "reg_rd1_to_alu", "reg_rd2_to_alusrc0", "alusrc_to_alu",
        "bus_to_imm_base", "bus_to_funct", "aluctrl_to_alu",
        "alu_to_memtoreg0", "memtoreg_to_reg"
      ],
      ctrlWires: ["ctrl_regdst", "ctrl_regwrite", "ctrl_aluop", "ctrl_alusrc", "ctrl_memtoreg"],
      muxSel: { regdst: "1", alusrc: "0", memtoreg: "0", pcsrc: "0", jump: "0" }
    },
    lw: {
      blocks: ["pc", "imem", "add_pc4", "control", "mux_regdst", "registers", "sign_ext", "mux_alusrc", "alu", "alu_ctrl", "dmem", "mux_memtoreg", "mux_pcsrc", "mux_jump"],
      dataWires: [
        "pc_to_imem", "pc_to_add4", "const4_to_add4", "add4_to_pcsrc0", "pcsrc_to_jump0", "jump_mux_to_pc",
        "imem_to_bus", "bus_to_ctrl", "bus_to_rs", "bus_to_rt_regdst0", "regdst_to_reg",
        "bus_to_imm_base", "bus_to_signext", "signext_to_alusrc1", "alusrc_to_alu",
        "reg_rd1_to_alu", "aluctrl_to_alu",
        "alu_to_dmem_addr", "dmem_to_memtoreg1", "memtoreg_to_reg"
      ],
      ctrlWires: ["ctrl_regdst", "ctrl_alusrc", "ctrl_memtoreg", "ctrl_regwrite", "ctrl_memread", "ctrl_aluop"],
      muxSel: { regdst: "0", alusrc: "1", memtoreg: "1", pcsrc: "0", jump: "0" }
    },
    sw: {
      blocks: ["pc", "imem", "add_pc4", "control", "registers", "sign_ext", "mux_alusrc", "alu", "alu_ctrl", "dmem", "mux_pcsrc", "mux_jump"],
      dataWires: [
        "pc_to_imem", "pc_to_add4", "const4_to_add4", "add4_to_pcsrc0", "pcsrc_to_jump0", "jump_mux_to_pc",
        "imem_to_bus", "bus_to_ctrl", "bus_to_rs", "bus_to_rt",
        "bus_to_imm_base", "bus_to_signext", "signext_to_alusrc1", "alusrc_to_alu",
        "reg_rd1_to_alu", "reg_rd2_to_dmem_wdata", "aluctrl_to_alu",
        "alu_to_dmem_addr"
      ],
      ctrlWires: ["ctrl_alusrc", "ctrl_memwrite", "ctrl_aluop"],
      muxSel: { regdst: "X", alusrc: "1", memtoreg: "X", pcsrc: "0", jump: "0" }
    },
    beq_not_taken: {
      blocks: ["pc", "imem", "add_pc4", "control", "registers", "sign_ext", "sl2_branch", "add_branch", "mux_alusrc", "alu", "alu_ctrl", "and_gate", "mux_pcsrc", "mux_jump"],
      dataWires: [
        "pc_to_imem", "pc_to_add4", "const4_to_add4", "add4_to_pcsrc0", "pcsrc_to_jump0", "jump_mux_to_pc",
        "imem_to_bus", "bus_to_ctrl", "bus_to_rs", "bus_to_rt",
        "reg_rd1_to_alu", "reg_rd2_to_alusrc0", "alusrc_to_alu", "aluctrl_to_alu",
        "alu_zero_to_and"
      ],
      ctrlWires: ["ctrl_branch", "ctrl_alusrc", "ctrl_aluop", "and_to_pcsrc"],
      muxSel: { regdst: "X", alusrc: "0", memtoreg: "X", pcsrc: "0", jump: "0" }
    },
    beq_taken: {
      blocks: ["pc", "imem", "add_pc4", "control", "registers", "sign_ext", "sl2_branch", "add_branch", "mux_alusrc", "alu", "alu_ctrl", "and_gate", "mux_pcsrc", "mux_jump"],
      dataWires: [
        "pc_to_imem", "pc_to_add4", "const4_to_add4", "add4_to_branch_add", "branch_add_to_pcsrc1", "pcsrc_to_jump0", "jump_mux_to_pc",
        "imem_to_bus", "bus_to_ctrl", "bus_to_rs", "bus_to_rt",
        "bus_to_imm_base", "bus_to_signext", "signext_to_sl2", "sl2_to_branch_add",
        "reg_rd1_to_alu", "reg_rd2_to_alusrc0", "alusrc_to_alu", "aluctrl_to_alu",
        "alu_zero_to_and"
      ],
      ctrlWires: ["ctrl_branch", "ctrl_alusrc", "ctrl_aluop", "and_to_pcsrc"],
      muxSel: { regdst: "X", alusrc: "0", memtoreg: "X", pcsrc: "1", jump: "0" }
    },
    addi: {
      blocks: ["pc", "imem", "add_pc4", "control", "mux_regdst", "registers", "sign_ext", "mux_alusrc", "alu", "alu_ctrl", "mux_memtoreg", "mux_pcsrc", "mux_jump"],
      dataWires: [
        "pc_to_imem", "pc_to_add4", "const4_to_add4", "add4_to_pcsrc0", "pcsrc_to_jump0", "jump_mux_to_pc",
        "imem_to_bus", "bus_to_ctrl", "bus_to_rs", "bus_to_rt_regdst0", "regdst_to_reg",
        "bus_to_imm_base", "bus_to_signext", "signext_to_alusrc1", "alusrc_to_alu",
        "reg_rd1_to_alu", "aluctrl_to_alu",
        "alu_to_memtoreg0", "memtoreg_to_reg"
      ],
      ctrlWires: ["ctrl_regdst", "ctrl_alusrc", "ctrl_memtoreg", "ctrl_regwrite", "ctrl_aluop"],
      muxSel: { regdst: "0", alusrc: "1", memtoreg: "0", pcsrc: "0", jump: "0" }
    },
    jump: {
      blocks: ["pc", "imem", "add_pc4", "control", "sl2_jump", "mux_jump"],
      dataWires: [
        "pc_to_imem", "pc_to_add4", "const4_to_add4", "add4_to_jump_concat",
        "imem_to_bus", "bus_to_ctrl", "bus_to_jump_sl2", "jump_sl2_to_mux1", "jump_mux_to_pc"
      ],
      ctrlWires: ["ctrl_jump"],
      muxSel: { regdst: "X", alusrc: "X", memtoreg: "X", pcsrc: "0", jump: "1" }
    }
  };

  function buildDatapathSvg(key, data) {
    const profile = datapathProfiles[key] || datapathProfiles.r_add;
    const activeBlocks = new Set(profile.blocks);
    const activeData = new Set(profile.dataWires);
    const activeCtrl = new Set(profile.ctrlWires);
    const sig = data.signals;
    const mux = profile.muxSel;

    const svgClasses = [
      "datapath-svg",
      dpDimInactive ? "dp-dim-inactive" : "",
      dpAnimateFlow ? "dp-animate-flow" : ""
    ].filter(Boolean).join(" ");

    // 資料線路座標表
    const dataWireDefs = [
      { id: "pc_to_imem", d: "M 92 371 L 135 371", arrow: true },
      { id: "pc_to_add4", d: "M 112 371 L 112 114 L 155 114", arrow: true },
      { id: "const4_to_add4", d: "M 136 148 L 155 148", arrow: true },
      { id: "add4_to_jump_concat", d: "M 205 130 L 232 130 L 232 66 L 412 66 L 412 74", arrow: false },
      { id: "add4_to_pcsrc0", d: "M 205 130 L 965 130", arrow: true },
      { id: "add4_to_branch_add", d: "M 205 130 L 712 130 L 712 166 L 735 166", arrow: true },
      { id: "imem_to_bus", d: "M 237 398 L 265 398", arrow: false },
      { id: "bus_to_jump_sl2", d: "M 265 398 L 265 92 L 294 92", arrow: true },
      { id: "jump_sl2_to_mux1", d: "M 362 92 L 412 92 L 412 74 L 1054 74", arrow: true },
      { id: "bus_to_ctrl", d: "M 265 398 L 265 246 L 330 246", arrow: true },
      { id: "bus_to_rs", d: "M 265 398 L 265 368 L 465 368", arrow: true },
      { id: "bus_to_rt", d: "M 265 398 L 465 398", arrow: true },
      { id: "bus_to_rt_regdst0", d: "M 265 398 L 374 398 L 374 422 L 402 422", arrow: true },
      { id: "bus_to_rd", d: "M 265 398 L 265 450 L 402 450", arrow: true },
      { id: "regdst_to_reg", d: "M 428 436 L 465 436", arrow: true },
      { id: "bus_to_imm_base", d: "M 265 398 L 265 548 L 478 548", arrow: false },
      { id: "bus_to_signext", d: "M 478 548 L 502 548", arrow: true },
      { id: "bus_to_funct", d: "M 478 548 L 478 594 L 682 594 L 682 560 L 704 560", arrow: true },
      { id: "reg_rd1_to_alu", d: "M 575 378 L 705 378", arrow: true },
      { id: "reg_rd2_to_alusrc0", d: "M 575 428 L 632 428", arrow: true },
      { id: "reg_rd2_to_dmem_wdata", d: "M 575 428 L 598 428 L 598 492 L 840 492 L 840 454 L 865 454", arrow: true },
      { id: "signext_to_alusrc1", d: "M 582 548 L 610 548 L 610 456 L 632 456", arrow: true },
      { id: "signext_to_sl2", d: "M 582 548 L 610 548 L 610 210 L 628 210", arrow: true },
      { id: "sl2_to_branch_add", d: "M 692 210 L 735 210", arrow: true },
      { id: "branch_add_to_pcsrc1", d: "M 785 186 L 822 186 L 822 158 L 965 158", arrow: true },
      { id: "alusrc_to_alu", d: "M 658 442 L 705 442", arrow: true },
      { id: "aluctrl_to_alu", d: "M 748 534 L 748 458", arrow: true },
      { id: "alu_zero_to_and", d: "M 790 384 L 832 384 L 832 240 L 876 240", arrow: true },
      { id: "alu_to_dmem_addr", d: "M 790 422 L 865 422", arrow: true },
      { id: "alu_to_memtoreg0", d: "M 790 422 L 818 422 L 818 524 L 1004 524 L 1004 446 L 1022 446", arrow: true },
      { id: "dmem_to_memtoreg1", d: "M 975 412 L 1022 412", arrow: true },
      { id: "memtoreg_to_reg", d: "M 1048 428 L 1088 428 L 1088 632 L 442 632 L 442 474 L 465 474", arrow: true },
      { id: "pcsrc_to_jump0", d: "M 991 144 L 1054 144", arrow: true },
      { id: "jump_mux_to_pc", d: "M 1080 108 L 1126 108 L 1126 20 L 28 20 L 28 371 L 50 371", arrow: true }
    ];

    // 控制線路座標表
    const ctrlWireDefs = [
      { id: "ctrl_jump", d: "M 392 196 L 418 196 L 418 38 L 1067 38 L 1067 56", label: "Jump", val: sig.Jump.val, lx: 465, ly: 33 },
      { id: "ctrl_branch", d: "M 406 256 L 852 256 L 852 226 L 876 226", label: "Branch", val: sig.Branch.val, lx: 465, ly: 251 },
      { id: "ctrl_memtoreg", d: "M 405 270 L 1035 270 L 1035 396", label: "MemtoReg", val: sig.MemtoReg.val, lx: 465, ly: 266 },
      { id: "ctrl_memread", d: "M 402 284 L 938 284 L 938 360", label: "MemRead", val: sig.MemRead.val, lx: 558, ly: 280 },
      { id: "ctrl_memwrite", d: "M 398 298 L 895 298 L 895 360", label: "MemWrite", val: sig.MemWrite.val, lx: 650, ly: 294 },
      { id: "ctrl_regwrite", d: "M 392 310 L 392 320 L 518 320 L 518 346", label: "RegWrite", val: sig.RegWrite.val, lx: 455, ly: 316 },
      { id: "ctrl_alusrc", d: "M 385 310 L 385 332 L 645 332 L 645 412", label: "ALUSrc", val: sig.ALUSrc.val, lx: 585, ly: 328 },
      { id: "ctrl_regdst", d: "M 352 306 L 352 388 L 415 388 L 415 408", label: "RegDst", val: sig.RegDst.val, lx: 388, ly: 384 },
      { id: "ctrl_aluop", d: "M 370 310 L 370 610 L 748 610 L 748 586", label: "ALUOp", val: sig.ALUOp.val, lx: 558, ly: 605 },
      { id: "and_to_pcsrc", d: "M 912 233 L 978 233 L 978 174", label: "PCSrc", val: mux.pcsrc, lx: 944, ly: 228 }
    ];

    function renderDataWire(w) {
      const isAct = activeData.has(w.id);
      const markerBase = w.arrow ? ' marker-end="url(#dp-arrow-dim)"' : "";
      const markerAct = w.arrow ? ' marker-end="url(#dp-arrow-data)"' : "";
      if (!isAct) {
        return `<path class="dp-wire-base dp-inactive" d="${w.d}"${markerBase} />`;
      }
      return `
        <g class="dp-wire-active">
          <path class="dp-hl-data-glow" d="${w.d}" filter="url(#dp-glow-data)" />
          <path class="dp-hl-data-core" d="${w.d}"${markerAct} />
          <path class="dp-hl-data-flow" d="${w.d}" />
        </g>
      `;
    }

    function renderCtrlWire(w) {
      const isAct = activeCtrl.has(w.id);
      const isOne = w.val === "1";
      const isX = w.val === "X" || w.val === "XX";
      const valClass = isOne ? "val-one" : (isX ? "val-x" : "");
      const badgeText = `${w.label}=${w.val}`;
      const badgeW = Math.max(48, badgeText.length * 6.4 + 8);
      if (!isAct) {
        return `
          <g class="dp-inactive">
            <path class="dp-ctrl-base" d="${w.d}" />
            <text x="${w.lx}" y="${w.ly}" class="dp-wire-label" style="font-size:8.5px;">${badgeText}</text>
          </g>
        `;
      }
      return `
        <g class="dp-ctrl-active">
          <path class="dp-hl-ctrl-glow" d="${w.d}" />
          <path class="dp-hl-ctrl-core" d="${w.d}" marker-end="url(#dp-arrow-ctrl)" />
          <rect x="${w.lx - 4}" y="${w.ly - 10}" width="${badgeW}" height="14" rx="3" class="dp-sig-badge-bg ${valClass}" />
          <text x="${w.lx}" y="${w.ly}" class="dp-sig-badge-text ${valClass}">${badgeText}</text>
        </g>
      `;
    }

    function blkClass(id, extra = "") {
      const stateCls = activeBlocks.has(id) ? "dp-block-active" : "dp-inactive";
      return `${stateCls} ${extra}`.trim();
    }

    function muxOptionStyle(selectedVal, optVal) {
      if (selectedVal === optVal) {
        return 'fill="#facc15" font-weight="800"';
      }
      return 'fill="#94a3b8" font-weight="500"';
    }

    // 先畫所有底層未高亮線路，再畫高亮控制線與高亮資料線（確保螢光筆永遠在最上層不被遮擋）
    const inactiveDataSvg = dataWireDefs.filter(w => !activeData.has(w.id)).map(renderDataWire).join("");
    const inactiveCtrlSvg = ctrlWireDefs.filter(w => !activeCtrl.has(w.id)).map(renderCtrlWire).join("");
    const activeCtrlSvg = ctrlWireDefs.filter(w => activeCtrl.has(w.id)).map(renderCtrlWire).join("");
    const activeDataSvg = dataWireDefs.filter(w => activeData.has(w.id)).map(renderDataWire).join("");

    return `
      <svg class="${svgClasses}" viewBox="0 0 1160 660" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MIPS 單週期處理器完整資料路徑圖：${data.name}">
        <defs>
          <filter id="dp-glow-data" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="dp-arrow-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
          </marker>
          <marker id="dp-arrow-data" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#fde047" />
          </marker>
          <marker id="dp-arrow-ctrl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
          </marker>
        </defs>

        <!-- 非作用中線路底層 -->
        <g>${inactiveCtrlSvg}${inactiveDataSvg}</g>

        <!-- 高亮螢光筆線路層 -->
        <g>${activeCtrlSvg}${activeDataSvg}</g>

        <!-- 匯流排位元寬度標註 -->
        <text x="122" y="152" class="dp-wire-label" style="font-size:11px;">4</text>
        <text x="270" y="86" class="dp-wire-label">[25:0]</text>
        <text x="310" y="61" class="dp-wire-label">PC+4[31:28]</text>
        <text x="435" y="68" class="dp-wire-label">Jump Addr [31:0]</text>
        <text x="270" y="241" class="dp-wire-label">[31:26]</text>
        <text x="270" y="363" class="dp-wire-label">[25:21] rs</text>
        <text x="270" y="393" class="dp-wire-label">[20:16] rt</text>
        <text x="270" y="445" class="dp-wire-label">[15:11] rd</text>
        <text x="270" y="542" class="dp-wire-label">[15:0] imm</text>
        <text x="485" y="589" class="dp-wire-label">[5:0] funct</text>
        <text x="580" y="372" class="dp-wire-label">Read data 1</text>
        <text x="580" y="422" class="dp-wire-label">Read data 2</text>
        <text x="795" y="378" class="dp-wire-label">Zero</text>
        <text x="794" y="416" class="dp-wire-label">ALU Result</text>
        <text x="756" y="502" class="dp-wire-label ${activeBlocks.has("alu_ctrl") ? "" : "dp-inactive"}" style="fill:#38bdf8;">${data.aluControl.code}</text>

        <!-- 硬體功能單元方塊 -->
        <!-- 1. PC -->
        <g class="${blkClass("pc")}">
          <rect x="50" y="335" width="42" height="72" rx="5" class="dp-block-shape" />
          <text x="71" y="376" class="dp-block-title">PC</text>
        </g>

        <!-- 2. Add (PC + 4) -->
        <g class="${blkClass("add_pc4")}">
          <polygon points="155,95 205,112 205,148 155,165 155,138 168,130 155,122" class="dp-block-shape" />
          <text x="184" y="134" class="dp-block-title" style="font-size:11px;">Add</text>
        </g>

        <!-- 3. Instruction Memory -->
        <g class="${blkClass("imem")}">
          <rect x="135" y="342" width="102" height="124" rx="6" class="dp-block-shape" />
          <text x="186" y="395" class="dp-block-title">Instruction</text>
          <text x="186" y="412" class="dp-block-title">Memory</text>
          <text x="142" y="374" class="dp-block-sub">Read addr</text>
          <text x="172" y="454" class="dp-block-sub">Inst [31:0]</text>
        </g>

        <!-- 4. Shift left 2 (Jump) -->
        <g class="${blkClass("sl2_jump")}">
          <ellipse cx="328" cy="92" rx="34" ry="20" class="dp-block-shape" />
          <text x="328" y="90" class="dp-block-title" style="font-size:10px;">Shift</text>
          <text x="328" y="102" class="dp-block-title" style="font-size:10px;">left 2</text>
        </g>

        <!-- 5. Control Unit -->
        <g class="${blkClass("control", "dp-ctrl-block")}">
          <ellipse cx="368" cy="246" rx="38" ry="64" class="dp-block-shape" />
          <text x="368" y="242" class="dp-block-title">Control</text>
          <text x="368" y="257" class="dp-block-sub" style="text-anchor:middle;">Main Unit</text>
        </g>

        <!-- 6. RegDst MUX -->
        <g class="${blkClass("mux_regdst")}">
          <rect x="402" y="408" width="26" height="58" rx="12" class="dp-block-shape" />
          <text x="415" y="425" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.regdst, "0")}>0</text>
          <text x="415" y="439" class="dp-block-sub" style="font-size:8px;text-anchor:middle;">M</text>
          <text x="415" y="454" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.regdst, "1")}>1</text>
        </g>

        <!-- 7. Registers -->
        <g class="${blkClass("registers")}">
          <rect x="465" y="346" width="110" height="148" rx="6" class="dp-block-shape" />
          <text x="520" y="424" class="dp-block-title">Registers</text>
          <text x="470" y="371" class="dp-block-sub">Read reg 1</text>
          <text x="470" y="401" class="dp-block-sub">Read reg 2</text>
          <text x="470" y="439" class="dp-block-sub">Write reg</text>
          <text x="470" y="477" class="dp-block-sub">Write data</text>
        </g>

        <!-- 8. Sign-extend -->
        <g class="${blkClass("sign_ext")}">
          <ellipse cx="542" cy="548" rx="40" ry="24" class="dp-block-shape" />
          <text x="542" y="545" class="dp-block-title" style="font-size:10.5px;">Sign-</text>
          <text x="542" y="558" class="dp-block-title" style="font-size:10.5px;">extend</text>
        </g>

        <!-- 9. Shift left 2 (Branch) -->
        <g class="${blkClass("sl2_branch")}">
          <ellipse cx="660" cy="210" rx="32" ry="20" class="dp-block-shape" />
          <text x="660" y="208" class="dp-block-title" style="font-size:10px;">Shift</text>
          <text x="660" y="220" class="dp-block-title" style="font-size:10px;">left 2</text>
        </g>

        <!-- 10. Branch Adder -->
        <g class="${blkClass("add_branch")}">
          <polygon points="735,148 785,166 785,208 735,226 735,196 748,187 735,178" class="dp-block-shape" />
          <text x="764" y="191" class="dp-block-title" style="font-size:11px;">Add</text>
        </g>

        <!-- 11. ALUSrc MUX -->
        <g class="${blkClass("mux_alusrc")}">
          <rect x="632" y="412" width="26" height="60" rx="12" class="dp-block-shape" />
          <text x="645" y="431" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.alusrc, "0")}>0</text>
          <text x="645" y="445" class="dp-block-sub" style="font-size:8px;text-anchor:middle;">M</text>
          <text x="645" y="460" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.alusrc, "1")}>1</text>
        </g>

        <!-- 12. Main ALU -->
        <g class="${blkClass("alu")}">
          <polygon points="705,352 790,378 790,446 705,472 705,425 724,412 705,399" class="dp-block-shape" />
          <text x="754" y="416" class="dp-block-title" style="font-size:13px;">ALU</text>
        </g>

        <!-- 13. ALU Control -->
        <g class="${blkClass("alu_ctrl", "dp-ctrl-block")}">
          <ellipse cx="748" cy="560" rx="44" ry="26" class="dp-block-shape" />
          <text x="748" y="556" class="dp-block-title" style="font-size:10.5px;">ALU</text>
          <text x="748" y="570" class="dp-block-title" style="font-size:10.5px;">Control</text>
        </g>

        <!-- 14. AND Gate (Branch & Zero) -->
        <g class="${blkClass("and_gate", "dp-ctrl-block")}">
          <path d="M 876 218 L 896 218 A 15 15 0 0 1 896 248 L 876 248 Z" class="dp-block-shape" />
          <text x="893" y="236" class="dp-block-title" style="font-size:9px;">AND</text>
        </g>

        <!-- 15. Data Memory -->
        <g class="${blkClass("dmem")}">
          <rect x="865" y="360" width="110" height="134" rx="6" class="dp-block-shape" />
          <text x="920" y="384" class="dp-block-title">Data</text>
          <text x="920" y="399" class="dp-block-title">Memory</text>
          <text x="870" y="426" class="dp-block-sub">Addr</text>
          <text x="870" y="458" class="dp-block-sub">Write data</text>
          <text x="970" y="416" class="dp-block-sub" style="text-anchor:end;">Read data</text>
        </g>

        <!-- 16. MemtoReg MUX -->
        <g class="${blkClass("mux_memtoreg")}">
          <rect x="1022" y="396" width="26" height="64" rx="12" class="dp-block-shape" />
          <text x="1035" y="415" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.memtoreg, "1")}>1</text>
          <text x="1035" y="431" class="dp-block-sub" style="font-size:8px;text-anchor:middle;">M</text>
          <text x="1035" y="450" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.memtoreg, "0")}>0</text>
        </g>

        <!-- 17. PCSrc MUX -->
        <g class="${blkClass("mux_pcsrc")}">
          <rect x="965" y="114" width="26" height="60" rx="12" class="dp-block-shape" />
          <text x="978" y="133" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.pcsrc, "0")}>0</text>
          <text x="978" y="147" class="dp-block-sub" style="font-size:8px;text-anchor:middle;">M</text>
          <text x="978" y="162" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.pcsrc, "1")}>1</text>
        </g>

        <!-- 18. Jump MUX -->
        <g class="${blkClass("mux_jump")}">
          <rect x="1054" y="56" width="26" height="104" rx="12" class="dp-block-shape" />
          <text x="1067" y="78" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.jump, "1")}>1</text>
          <text x="1067" y="112" class="dp-block-sub" style="font-size:8px;text-anchor:middle;">M</text>
          <text x="1067" y="148" style="font-size:10px;text-anchor:middle;" ${muxOptionStyle(mux.jump, "0")}>0</text>
        </g>
      </svg>
    `;
  }

  function openDatapathFullscreen(key, data) {
    const existing = document.getElementById("dpFullscreenModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "dpFullscreenModal";
    modal.className = "dp-modal-overlay";
    modal.innerHTML = `
      <div class="dp-modal-header">
        <div>
          <strong style="font-size:1.1rem; font-family:var(--font-mono); color:#fde047;">${data.name}</strong>
          <span style="margin-left:0.75rem; font-size:0.85rem; color:#94a3b8;">單週期處理器完整資料路徑螢光高亮檢視</span>
        </div>
        <button id="btnCloseDpModal" class="dp-tool-btn" style="background:#1e293b; color:#f8fafc; border-color:#475569;">關閉全螢幕 (Esc)</button>
      </div>
      <div class="dp-modal-body">
        ${buildDatapathSvg(key, data)}
      </div>
    `;
    document.body.appendChild(modal);

    function closeModal() {
      modal.remove();
      document.removeEventListener("keydown", onEsc);
    }
    function onEsc(e) {
      if (e.key === "Escape") closeModal();
    }
    document.getElementById("btnCloseDpModal").addEventListener("click", closeModal);
    modal.addEventListener("click", function(e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", onEsc);
  }

  // 2. 渲染指令即時剖析器
  function renderInspector(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let selectorHtml = `
      <div class="card" style="margin-bottom: 1.5rem; background: var(--bg-card);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="color: var(--primary); font-size: 1.2rem; margin-bottom: 0.25rem;">
              單週期微架構：指令控制訊號與資料流即時剖析器
            </h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">
              點選下方指令，硬體將即時重構資料路徑、計算 MUX 導通狀態並輸出 9 大主控制訊號與 ALU 碼：
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" id="ch4InstBtnGroup">
    `;

    const keys = Object.keys(instructions);
    keys.forEach((key, index) => {
      const activeClass = index === 0 ? "active" : "";
      const inst = instructions[key];
      const btnLabel = key === "beq_not_taken"
        ? "beq (Not Taken)"
        : key === "beq_taken"
          ? "beq (Taken)"
          : `${inst.name.split(" ")[0]} (${inst.type.split(" ")[0]})`;
      selectorHtml += `
        <button class="filter-btn ch4-inst-btn ${activeClass}" data-key="${key}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
          ${btnLabel}
        </button>
      `;
    });

    selectorHtml += `
          </div>
        </div>
      </div>
      <div id="ch4DetailDisplay"></div>
    `;

    container.innerHTML = selectorHtml;

    const btns = container.querySelectorAll(".ch4-inst-btn");
    btns.forEach(b => {
      b.addEventListener("click", function() {
        btns.forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        const key = this.getAttribute("data-key");
        displayInstructionDetail(key, "ch4DetailDisplay");
      });
    });

    displayInstructionDetail(keys[0], "ch4DetailDisplay");
  }

  function displayInstructionDetail(key, targetContainerId) {
    const target = document.getElementById(targetContainerId);
    if (!target) return;

    const data = instructions[key];

    let html = `
      <div class="card" style="border-left: 5px solid var(--primary); margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
          <div>
            <h3 style="color: var(--text-main); font-size: 1.3rem; margin: 0; font-family: var(--font-mono);">
              ${data.name}
            </h3>
            <div style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.25rem;">
              類型：<span class="badge badge-primary">${data.type}</span> &nbsp;|&nbsp;
              Opcode：<code>${data.opcode}</code> &nbsp;|&nbsp;
              Funct：<code>${data.funct}</code>
              ${data.examExercise ? `&nbsp;|&nbsp; <span class="badge badge-warning">${data.examExercise}</span>` : ""}
            </div>
          </div>
        </div>

        <div class="datapath-panel">
          <div class="datapath-toolbar">
            <div>
              <h4 style="color: #fde047; font-size: 1rem; margin: 0 0 0.35rem 0;">一、 完整單週期資料路徑螢光高亮圖 (Full Datapath Highlighter)</h4>
              <div class="datapath-legend">
                <span class="datapath-legend-item"><span class="dp-swatch dp-swatch-data"></span>作用中資料流（黃色螢光筆）</span>
                <span class="datapath-legend-item"><span class="dp-swatch dp-swatch-ctrl"></span>作用中控制訊號（青藍高亮）</span>
                <span class="datapath-legend-item"><span class="dp-swatch dp-swatch-inactive"></span>閒置 / Don't Care 路徑</span>
              </div>
            </div>
            <div class="datapath-controls">
              <button type="button" id="btnDpToggleDim" class="dp-tool-btn ${dpDimInactive ? "active" : ""}">
                ${dpDimInactive ? "螢光筆聚焦：開啟" : "螢光筆聚焦：關閉"}
              </button>
              <button type="button" id="btnDpToggleFlow" class="dp-tool-btn ${dpAnimateFlow ? "active" : ""}">
                ${dpAnimateFlow ? "流動動畫：開啟" : "流動動畫：關閉"}
              </button>
              <button type="button" id="btnDpFullscreen" class="dp-tool-btn">
                全螢幕大圖
              </button>
            </div>
          </div>
          <div class="datapath-svg-scroll" id="ch4DatapathSvgMount">
            ${buildDatapathSvg(key, data)}
          </div>
        </div>

        <h4 style="color: var(--primary); font-size: 1rem; margin-bottom: 0.75rem;">二、 主控制單元輸出訊號 (Main Control Signals)</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem;">
    `;

    for (const [sigName, sigObj] of Object.entries(data.signals)) {
      const isOne = sigObj.val === "1";
      const isX = sigObj.val === "X";
      const badgeBg = isOne ? "rgba(16, 185, 129, 0.15)" : (isX ? "rgba(148, 163, 184, 0.15)" : "rgba(30, 41, 59, 0.5)");
      const badgeBorder = isOne ? "#10b981" : (isX ? "#64748b" : "#334155");
      const textColor = isOne ? "#10b981" : (isX ? "#94a3b8" : "#e2e8f0");

      html += `
        <div style="background: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 6px; padding: 0.75rem; text-align: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">${sigName}</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: ${textColor}; font-family: var(--font-mono); margin: 0.2rem 0;">
            ${sigObj.val}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;" title="${sigObj.note}">
            ${sigObj.note.substring(0, 18)}...
          </div>
        </div>
      `;
    }

    html += `
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          <div style="background: var(--bg-secondary); padding: 1rem 1.25rem; border-radius: var(--radius); border: 1px solid var(--border-color);">
            <h4 style="color: #38bdf8; font-size: 0.95rem; margin-bottom: 0.5rem;">三、 ALU 控制單元輸出 (ALU Control Unit)</h4>
            <div style="font-size: 0.88rem; line-height: 1.7; color: var(--text-main);">
              • <strong>ALUOp 輸入</strong>：<code>${data.signals.ALUOp.val}</code><br>
              • <strong>ALU Control (4 bits)</strong>：<strong style="color: #38bdf8; font-size: 1.05rem;"><code>${data.aluControl.code}</code></strong><br>
              • <strong>ALU 實際執行運算</strong>：<strong>${data.aluControl.op}</strong>
            </div>
          </div>

          <div style="background: var(--bg-secondary); padding: 1rem 1.25rem; border-radius: var(--radius); border: 1px solid var(--border-color);">
            <h4 style="color: #fbbf24; font-size: 0.95rem; margin-bottom: 0.5rem;">四、 多工器導通狀態 (MUX Selections)</h4>
            <div style="font-size: 0.85rem; line-height: 1.7; color: var(--text-main); font-family: var(--font-mono);">
              • <strong>RegDst MUX</strong>：${data.muxes.RegDstMUX}<br>
              • <strong>ALUSrc MUX</strong>：${data.muxes.ALUSrcMUX}<br>
              • <strong>MemtoReg MUX</strong>：${data.muxes.MemtoRegMUX}<br>
              • <strong>PCSrc MUX</strong>：${data.muxes.PCSrcMUX}<br>
              • <strong>Jump MUX</strong>：${data.muxes.JumpMUX}
            </div>
          </div>
        </div>

        <div style="background: var(--code-bg); padding: 1.15rem; border-radius: var(--radius); border: 1px solid var(--border-color);">
          <h4 style="color: #a855f7; font-size: 0.95rem; margin-bottom: 0.4rem;">五、 實際資料流通路徑與關鍵延遲 (Datapath Trace & Delay)</h4>
          <p style="font-size: 0.88rem; color: #f8fafc; margin-bottom: 0.5rem; line-height: 1.6;">
            <strong>資料流動軌跡</strong>：<br>${data.pathDescription}
          </p>
          <div style="font-size: 0.85rem; color: #94a3b8; font-family: var(--font-mono);">
            <strong>指令延遲公式</strong>：${data.latencyFormula}
          </div>
        </div>
      </div>
    `;

    target.innerHTML = html;

    // 綁定大圖工具列按鈕事件
    const btnDim = document.getElementById("btnDpToggleDim");
    const btnFlow = document.getElementById("btnDpToggleFlow");
    const btnFull = document.getElementById("btnDpFullscreen");

    if (btnDim) {
      btnDim.addEventListener("click", function() {
        dpDimInactive = !dpDimInactive;
        displayInstructionDetail(key, targetContainerId);
      });
    }
    if (btnFlow) {
      btnFlow.addEventListener("click", function() {
        dpAnimateFlow = !dpAnimateFlow;
        displayInstructionDetail(key, targetContainerId);
      });
    }
    if (btnFull) {
      btnFull.addEventListener("click", function() {
        openDatapathFullscreen(key, data);
      });
    }

    if (window.CO_SOLVER && typeof window.CO_SOLVER.renderMath === "function") {
      window.CO_SOLVER.renderMath(target);
    }
  }

  // 3. 仿照課堂 Exercise 的全真變種出題庫與特訓引擎
  const exerciseTemplates = [
    {
      id: "ex_addi",
      category: "題目 0 變種 (學號總和 % 4 == 0)",
      generate: function() {
        const regs = ["$t0", "$t1", "$t2", "$t3", "$s0", "$s1", "$s2"];
        const rt = regs[Math.floor(Math.random() * regs.length)];
        let rs = regs[Math.floor(Math.random() * regs.length)];
        while (rs === rt) rs = regs[Math.floor(Math.random() * regs.length)];
        const imm = (Math.floor(Math.random() * 20) - 8); // -8 to 11
        const instStr = `addi ${rt}, ${rs}, ${imm}`;

        return {
          instStr,
          rt, rs, imm,
          type: "I-type (立即值加法)",
          signals: { RegDst: "0", ALUSrc: "1", MemtoReg: "0", RegWrite: "1", MemRead: "0", MemWrite: "0", Branch: "0", ALUOp: "00" },
          aluOpName: "add",
          aluControl: "0010",
          inputDesc: `暫存器 ${rs} 之數值，以及符號延展後的立即值 ${imm}`,
          outputDesc: `暫存器 ${rt} 被寫入 R[${rs}] + ${imm}`,
          memDesc: "無存取 (MemRead=0, MemWrite=0)",
          principles: [
            `<strong>1. RegDst 為什麼是 0？</strong>：addi 是 I-type 指令，其目的暫存器位在指令的 <code>rt</code> 欄位（Bits 20:16），故 RegDst MUX 必須選通 0。若誤設為 1，將會錯誤寫入 <code>rd</code> 欄位（Bits 15:11，在 addi 中此欄位根本不存在，其實是立即值的高位部分，會導致不可預期的暫存器被覆寫！）。`,
            `<strong>2. ALUSrc 為什麼是 1？</strong>：ALU 的第二個運算數必須來自 16 位元立即值（經符號延展為 32 位元），而非暫存器 Read data 2，故 ALUSrc 設為 1。`,
            `<strong>3. MemtoReg 為什麼是 0？</strong>：addi 的運算結果是由 ALU 產生的，不需要讀取記憶體，故 MemtoReg MUX 選擇 0（ALU Result）。`,
            `<strong>4. RegWrite 為什麼是 1？</strong>：需要將累加結果更新回暫存器 ${rt}，故致能寫入開關。`,
            `<strong>5. ALUOp 為什麼是 00？</strong>：主控制器送出 00，直接命令 ALU 控制單元輸出 0010（add），強制執行加法。`
          ]
        };
      }
    },
    {
      id: "ex_lw",
      category: "題目 1 變種 (學號總和 % 4 == 1)",
      generate: function() {
        const destRegs = ["$t1", "$t2", "$s0", "$s1", "$v0"];
        const baseRegs = ["$s2", "$s3", "$sp", "$fp", "$a0"];
        const rt = destRegs[Math.floor(Math.random() * destRegs.length)];
        const rs = baseRegs[Math.floor(Math.random() * baseRegs.length)];
        const offset = (Math.floor(Math.random() * 8) + 1) * 4; // 4, 8, 12, ... 32
        const instStr = `lw ${rt}, ${offset}(${rs})`;

        return {
          instStr,
          rt, rs, offset,
          type: "I-type (載入字組 Load Word)",
          signals: { RegDst: "0", ALUSrc: "1", MemtoReg: "1", RegWrite: "1", MemRead: "1", MemWrite: "0", Branch: "0", ALUOp: "00" },
          aluOpName: "add",
          aluControl: "0010",
          inputDesc: `基底暫存器 ${rs} 之位址，以及符號延展後的位移量 ${offset}`,
          outputDesc: `暫存器 ${rt} 載入記憶體位址 Mem[R[${rs}] + ${offset}] 的資料`,
          memDesc: `自資料記憶體讀取位址 R[${rs}] + ${offset}`,
          principles: [
            `<strong>1. MemtoReg 為什麼是 1？</strong>：lw 是唯一將<strong>資料記憶體讀出數值</strong>寫入暫存器的指令，故 MemtoReg MUX 必須選通 1。若誤設為 0，暫存器將寫入計算出來的「記憶體位址」，而非該位址裡面的「資料」！`,
            `<strong>2. MemRead 為什麼是 1，MemWrite 為什麼是 0？</strong>：只進行讀取操作。若 MemWrite 誤設為 1，將會破壞記憶體內容。`,
            `<strong>3. ALUOp 為什麼是 00？</strong>：有效位址計算需要將基底位址與位移量相加（Base + Offset），故 ALU 執行加法（0010）。`,
            `<strong>4. 關鍵路徑核心（Critical Path）</strong>：lw 必須完整穿透 IF &rarr; ID &rarr; EX &rarr; MEM &rarr; WB 五個階段，其延遲決定了單週期處理器的時脈週期下限。`
          ]
        };
      }
    },
    {
      id: "ex_sw",
      category: "題目 2 變種 (學號總和 % 4 == 2)",
      generate: function() {
        const srcRegs = ["$t1", "$t2", "$s0", "$s1", "$a0"];
        const baseRegs = ["$s2", "$s3", "$sp", "$gp"];
        const rt = srcRegs[Math.floor(Math.random() * srcRegs.length)];
        const rs = baseRegs[Math.floor(Math.random() * baseRegs.length)];
        const offset = (Math.floor(Math.random() * 6) + 1) * 4;
        const instStr = `sw ${rt}, ${offset}(${rs})`;

        return {
          instStr,
          rt, rs, offset,
          type: "I-type (儲存字組 Store Word)",
          signals: { RegDst: "X", ALUSrc: "1", MemtoReg: "X", RegWrite: "0", MemRead: "0", MemWrite: "1", Branch: "0", ALUOp: "00" },
          aluOpName: "add",
          aluControl: "0010",
          inputDesc: `基底暫存器 ${rs}、待儲存資料暫存器 ${rt}、位移量 ${offset}`,
          outputDesc: `無暫存器寫入 (RegWrite=0)`,
          memDesc: `將 R[${rt}] 的數值寫入記憶體位址 R[${rs}] + ${offset}`,
          principles: [
            `<strong>1. RegWrite 為什麼必須是 0？</strong>：sw 指令的目的是將暫存器資料寫入外部記憶體，絕不可變更暫存器內部數值，故 RegWrite 必須關閉（0）。`,
            `<strong>2. 為什麼 RegDst 與 MemtoReg 是 Don't Care (X)？</strong>：因為 RegWrite = 0，暫存器寫入閥門完全關閉。無論前面的 MUX 選通哪一個暫存器編號或哪一筆資料，都不會產生任何寫入動作。在硬體設計中標註為 X 可化簡卡諾圖，節省電晶體面積。`,
            `<strong>3. MemWrite 為什麼是 1？</strong>：致能記憶體寫入，於時鐘正緣時將 Read data 2（即暫存器 ${rt} 的值）寫入指定的記憶體位址。`
          ]
        };
      }
    },
    {
      id: "ex_beq_not_taken",
      category: "題目 3 變種 (學號總和 % 4 == 3, Not Taken)",
      generate: function() {
        const regs = ["$t1", "$t2", "$t3", "$s0", "$s1"];
        const r1 = regs[Math.floor(Math.random() * regs.length)];
        let r2 = regs[Math.floor(Math.random() * regs.length)];
        while (r2 === r1) r2 = regs[Math.floor(Math.random() * regs.length)];
        const instStr = `beq ${r1}, ${r2}, Else_Label (條件不成立: R[${r1}] != R[${r2}])`;

        return {
          instStr,
          r1, r2,
          type: "I-type (條件分支 beq - Branch NOT Taken)",
          signals: { RegDst: "X", ALUSrc: "0", MemtoReg: "X", RegWrite: "0", MemRead: "0", MemWrite: "0", Branch: "1", ALUOp: "01" },
          aluOpName: "subtract",
          aluControl: "0110",
          inputDesc: `兩比較暫存器 ${r1} 與 ${r2} 之數值`,
          outputDesc: `無暫存器寫入；PC 更新為 PC + 4 (循序前進)`,
          memDesc: "無記憶體存取",
          principles: [
            `<strong>1. ALU 為什麼執行減法 (ALUOp = 01)？</strong>：硬體比對兩數是否相等的最高效方式是直接做減法：R[${r1}] - R[${r2}]。若兩數相等差值為 0，Zero 旗標輸出 1；若不相等則 Zero 輸出 0。`,
            `<strong>2. 為什麼 PCSrc 最終為 0？</strong>：硬體使用 AND 閘判定分支是否成立：<code>PCSrc = Branch AND Zero</code>。本題中 Branch = 1，但因條件不相等導致 Zero = 0，故 <code>PCSrc = 1 AND 0 = 0</code>。PCSrc MUX 選擇 0，載入 PC + 4，跳轉不發生！`,
            `<strong>3. 為什麼 ALUSrc 是 0？</strong>：ALU 的第二個輸入端必須是來自暫存器 ${r2} 的數值（Read data 2），而非立即值，故 ALUSrc 設為 0。`,
            `<strong>4. 不寫入暫存器與記憶體</strong>：RegWrite = 0, MemWrite = 0，RegDst 與 MemtoReg 皆為 Don't Care (X)。`
          ]
        };
      }
    },
    {
      id: "ex_beq_taken",
      category: "題目 3 延伸 (Branch Taken, 跳轉成立)",
      generate: function() {
        const regs = ["$t1", "$t2", "$s0", "$s1"];
        const r1 = regs[Math.floor(Math.random() * regs.length)];
        const instStr = `beq ${r1}, ${r1}, Target_Loop (條件成立: 兩暫存器相同，必相等)`;

        return {
          instStr,
          r1,
          type: "I-type (條件分支 beq - Branch Taken)",
          signals: { RegDst: "X", ALUSrc: "0", MemtoReg: "X", RegWrite: "0", MemRead: "0", MemWrite: "0", Branch: "1", ALUOp: "01" },
          aluOpName: "subtract",
          aluControl: "0110",
          inputDesc: `兩比較暫存器之數值，以及分支標籤位移量`,
          outputDesc: `無暫存器寫入；PC 載入分支目標位址 (PC+4)+(offset<<2)`,
          memDesc: "無記憶體存取",
          principles: [
            `<strong>1. 為什麼 PCSrc 最終為 1？</strong>：因兩暫存器數值相同，ALU 減法結果必為 0，產生 <code>Zero = 1</code>。與主控制器的 <code>Branch = 1</code> 經由 AND 閘：<code>PCSrc = 1 AND 1 = 1</code>。`,
            `<strong>2. 目標位址載入 PC</strong>：PCSrc MUX 選擇第 1 埠，將分支專用加法器計算出的目標位址載入 PC，完成跳轉。`
          ]
        };
      }
    },
    {
      id: "ex_rtype",
      category: "延伸真題 (R-format 算術運算)",
      generate: function() {
        const ops = [
          { name: "sub", funct: "0x22", code: "0110", opName: "subtract" },
          { name: "and", funct: "0x24", code: "0000", opName: "AND" },
          { name: "or", funct: "0x25", code: "0001", opName: "OR" },
          { name: "slt", funct: "0x2A", code: "0111", opName: "set-on-less-than" }
        ];
        const chosen = ops[Math.floor(Math.random() * ops.length)];
        const instStr = `${chosen.name} $t0, $s1, $s2`;

        return {
          instStr,
          chosen,
          type: "R-type (暫存器運算)",
          signals: { RegDst: "1", ALUSrc: "0", MemtoReg: "0", RegWrite: "1", MemRead: "0", MemWrite: "0", Branch: "0", ALUOp: "10" },
          aluOpName: chosen.opName,
          aluControl: chosen.code,
          inputDesc: `暫存器 $s1 (rs) 與 $s2 (rt) 之數值`,
          outputDesc: `運算結果寫入目的暫存器 $t0 (rd)`,
          memDesc: "無記憶體存取",
          principles: [
            `<strong>1. RegDst 為什麼是 1？</strong>：R-type 指令之目的暫存器固定位於指令的 <code>rd</code> 欄位（Bits 15:11），故 RegDst 設為 1。`,
            `<strong>2. ALUOp 為什麼是 10？</strong>：告知 ALU 控制器檢查 <code>funct</code> 欄位（本指令為 ${chosen.funct}），產生對應的 4 位元碼 ${chosen.code}。`,
            `<strong>3. MemtoReg 為什麼是 0？</strong>：寫回暫存器的資料來自 ALU 運算結果。`
          ]
        };
      }
    }
  ];

  let currentQuiz = null;

  // 4. 渲染特訓中心主框架
  function renderTeacherExerciseLab(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
      <!-- 頂部模式切換與導引列 -->
      <div class="card" style="margin-bottom: 1.5rem; border-left: 5px solid #fbbf24; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(30, 41, 59, 0.7) 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="color: #fbbf24; font-size: 1.25rem; margin-bottom: 0.35rem;">
              老師課堂 Datapath Exercise 仿全真變種實戰特訓中心（投影片第 49-53 頁）
            </h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0; line-height: 1.6;">
              專為應對課堂抽題與期末手寫大題設計！涵蓋動態隨機抽題變種、親自填空作答、即時批改評分、以及每一訊號背後的硬體底層物理原理與除錯剖析。
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button id="btnSwitchQuizMode" class="mode-btn active" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;">
              實戰隨機抽題作答特訓
            </button>
            <button id="btnSwitchStaticMode" class="mode-btn" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;">
              課堂 4 大原始真題全真對照
            </button>
          </div>
        </div>
      </div>

      <!-- 區域 A：動態隨機抽題實戰特訓區 (預設顯示) -->
      <div id="exerciseQuizArea">
        <div class="card" style="border-left: 4px solid var(--primary); margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <span class="badge badge-primary" id="quizCategoryBadge">題目類別</span>
              <h2 id="quizInstPrompt" style="color: #38bdf8; font-family: var(--font-mono); font-size: 1.5rem; margin: 0.4rem 0 0 0;">
                指令載入中...
              </h2>
            </div>
            <button id="btnRerollQuiz" class="action-btn btn-secondary" style="font-size: 0.88rem; padding: 0.45rem 1rem;">
              換一題 (隨機全新變種)
            </button>
          </div>

          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">
            請依據上方指令，推導並填寫該指令在單週期 MIPS 資料路徑中所產生的 <strong>9 大主控制訊號</strong>、<strong>ALU 運算</strong>與<strong>輸入輸出行為</strong>（若為 Don't Care 請填寫大寫 <code>X</code>）：
          </p>

          <!-- 9 大訊號輸入表單 -->
          <div style="background: var(--bg-secondary); padding: 1.25rem; border-radius: var(--radius); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
            <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 0.75rem;">1. 主控制訊號設定 (請選擇或輸入 0 / 1 / X)</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.75rem;">
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.25rem;">RegDst</label>
                <select id="input_RegDst" class="quiz-select">
                  <option value="">選擇</option><option value="0">0</option><option value="1">1</option><option value="X">X</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.25rem;">ALUSrc</label>
                <select id="input_ALUSrc" class="quiz-select">
                  <option value="">選擇</option><option value="0">0</option><option value="1">1</option><option value="X">X</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.25rem;">MemtoReg</label>
                <select id="input_MemtoReg" class="quiz-select">
                  <option value="">選擇</option><option value="0">0</option><option value="1">1</option><option value="X">X</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.25rem;">RegWrite</label>
                <select id="input_RegWrite" class="quiz-select">
                  <option value="">選擇</option><option value="0">0</option><option value="1">1</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.25rem;">MemRead</label>
                <select id="input_MemRead" class="quiz-select">
                  <option value="">選擇</option><option value="0">0</option><option value="1">1</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.25rem;">MemWrite</label>
                <select id="input_MemWrite" class="quiz-select">
                  <option value="">選擇</option><option value="0">0</option><option value="1">1</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.25rem;">Branch</label>
                <select id="input_Branch" class="quiz-select">
                  <option value="">選擇</option><option value="0">0</option><option value="1">1</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.25rem;">ALUOp (2-bit)</label>
                <select id="input_ALUOp" class="quiz-select">
                  <option value="">選擇</option><option value="00">00</option><option value="01">01</option><option value="10">10</option><option value="XX">XX</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ALU 運算與控制碼 -->
          <div style="background: var(--bg-secondary); padding: 1.25rem; border-radius: var(--radius); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
            <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 0.75rem;">2. ALU 控制與運算動作</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div>
                <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.35rem;">ALU 實際執行的硬體功能</label>
                <select id="input_aluOpName" class="quiz-select" style="width: 100%;">
                  <option value="">請選擇運算動作</option>
                  <option value="add">add (加法)</option>
                  <option value="subtract">subtract (減法)</option>
                  <option value="AND">AND (邏輯且)</option>
                  <option value="OR">OR (邏輯或)</option>
                  <option value="set-on-less-than">set-on-less-than (小於置 1)</option>
                  <option value="NOR">NOR (反或)</option>
                  <option value="Don't Care">Don't Care (不運算)</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.35rem;">ALU 4 位元控制碼 (ALU Control)</label>
                <select id="input_aluControl" class="quiz-select" style="width: 100%;">
                  <option value="">請選擇 4-bit 代碼</option>
                  <option value="0010">0010 (add)</option>
                  <option value="0110">0110 (subtract)</option>
                  <option value="0000">0000 (AND)</option>
                  <option value="0001">0001 (OR)</option>
                  <option value="0111">0111 (slt)</option>
                  <option value="1100">1100 (NOR)</option>
                  <option value="XXXX">XXXX (Don't Care)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 作答操作按鈕 -->
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <button id="btnSubmitQuiz" class="action-btn btn-primary" style="font-size: 0.95rem; padding: 0.55rem 1.75rem;">
              送出作答並評分
            </button>
            <button id="btnShowAnswerDirect" class="action-btn btn-secondary" style="font-size: 0.88rem; padding: 0.55rem 1.25rem;">
              直接查看本題標準詳解與原理
            </button>
            <div id="quizScoreFeedback" style="font-size: 1rem; font-weight: bold;"></div>
          </div>

          <!-- 深度原理與逐步解析展示區 (送出後或點擊查看後展開) -->
          <div id="quizSolutionDetailArea" style="display: none; margin-top: 1.5rem; border-top: 2px dashed var(--border-color); padding-top: 1.25rem;"></div>

        </div>
      </div>

      <!-- 區域 B：老師課堂原始 4 大真題對照區 (預設隱藏，可切換) -->
      <div id="exerciseStaticArea" style="display: none;"></div>
    `;

    container.innerHTML = html;

    // 注入自訂選單樣式
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      .quiz-select {
        width: 100%;
        padding: 0.45rem 0.5rem;
        border-radius: 4px;
        background: var(--code-bg);
        color: var(--text-main);
        border: 1px solid var(--border-color);
        font-family: var(--font-mono);
        font-size: 0.9rem;
      }
      .quiz-select:focus {
        border-color: var(--primary);
        outline: none;
      }
      .field-correct {
        border-color: #10b981 !important;
        background: rgba(16, 185, 129, 0.15) !important;
      }
      .field-wrong {
        border-color: #f43f5e !important;
        background: rgba(244, 63, 94, 0.15) !important;
      }
    `;
    document.head.appendChild(styleEl);

    // 綁定模式切換
    const btnQuizMode = document.getElementById("btnSwitchQuizMode");
    const btnStaticMode = document.getElementById("btnSwitchStaticMode");
    const quizArea = document.getElementById("exerciseQuizArea");
    const staticArea = document.getElementById("exerciseStaticArea");

    btnQuizMode.addEventListener("click", function() {
      btnQuizMode.classList.add("active");
      btnStaticMode.classList.remove("active");
      quizArea.style.display = "block";
      staticArea.style.display = "none";
    });

    btnStaticMode.addEventListener("click", function() {
      btnStaticMode.classList.add("active");
      btnQuizMode.classList.remove("active");
      quizArea.style.display = "none";
      staticArea.style.display = "block";
      renderStaticExercises("exerciseStaticArea");
    });

    // 綁定抽題按鈕
    document.getElementById("btnRerollQuiz").addEventListener("click", () => setupNewQuiz());
    document.getElementById("btnSubmitQuiz").addEventListener("click", () => gradeQuiz());
    document.getElementById("btnShowAnswerDirect").addEventListener("click", () => revealQuizSolution(true));

    // 初次載入第一題
    setupNewQuiz();
  }

  // 抽一道新題目
  function setupNewQuiz() {
    const template = exerciseTemplates[Math.floor(Math.random() * exerciseTemplates.length)];
    currentQuiz = template.generate();

    document.getElementById("quizCategoryBadge").textContent = template.category;
    document.getElementById("quizInstPrompt").textContent = currentQuiz.instStr;

    // 清空表單與反饋
    const selects = document.querySelectorAll(".quiz-select");
    selects.forEach(s => {
      s.value = "";
      s.classList.remove("field-correct", "field-wrong");
    });

    document.getElementById("quizScoreFeedback").innerHTML = "";
    const detailArea = document.getElementById("quizSolutionDetailArea");
    detailArea.style.display = "none";
    detailArea.innerHTML = "";
  }

  // 批改評分
  function gradeQuiz() {
    if (!currentQuiz) return;

    let correctCount = 0;
    const totalFields = 10; // 8 訊號 + 2 ALU

    const checkMap = {
      "input_RegDst": currentQuiz.signals.RegDst,
      "input_ALUSrc": currentQuiz.signals.ALUSrc,
      "input_MemtoReg": currentQuiz.signals.MemtoReg,
      "input_RegWrite": currentQuiz.signals.RegWrite,
      "input_MemRead": currentQuiz.signals.MemRead,
      "input_MemWrite": currentQuiz.signals.MemWrite,
      "input_Branch": currentQuiz.signals.Branch,
      "input_ALUOp": currentQuiz.signals.ALUOp,
      "input_aluOpName": currentQuiz.aluOpName,
      "input_aluControl": currentQuiz.aluControl
    };

    for (const [elemId, expected] of Object.entries(checkMap)) {
      const el = document.getElementById(elemId);
      if (!el) continue;
      const userVal = el.value.trim();
      const isOk = userVal === expected || (expected === "X" && userVal === "X") || (expected === "XX" && userVal === "XX");
      el.classList.remove("field-correct", "field-wrong");
      if (isOk) {
        el.classList.add("field-correct");
        correctCount++;
      } else {
        el.classList.add("field-wrong");
      }
    }

    const score = Math.round((correctCount / totalFields) * 100);
    const feedback = document.getElementById("quizScoreFeedback");

    if (score === 100) {
      feedback.innerHTML = `<span style="color: #10b981;">滿分 100 分！所有訊號與 ALU 運算完全正確！</span>`;
    } else {
      feedback.innerHTML = `<span style="color: #f43f5e;">得分：${score} 分（答對 ${correctCount}/${totalFields} 項）。已為您標註紅色錯題，請檢視下方原理剖析。</span>`;
    }

    revealQuizSolution(false);
  }

  // 展開詳細解答與原理
  function revealQuizSolution(isDirectReveal) {
    const detailArea = document.getElementById("quizSolutionDetailArea");
    if (!detailArea || !currentQuiz) return;

    let html = `
      <div style="background: var(--bg-primary); padding: 1.25rem; border-radius: var(--radius); border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h4 style="color: #38bdf8; font-size: 1.1rem; margin: 0;">
            本題全真標準解答與微架構物理原理深度剖析
          </h4>
          <span class="badge badge-success">標準滿分解法</span>
        </div>

        <!-- 訊號標準對照表 -->
        <h5 style="color: #fbbf24; font-size: 0.92rem; margin: 0.75rem 0 0.4rem 0;">1. 9 大控制訊號標準值對照</h5>
        <div style="overflow-x: auto; margin-bottom: 1rem;">
          <table class="data-table" style="font-size: 0.82rem; text-align: center;">
            <thead>
              <tr>
                <th>RegDst</th><th>ALUSrc</th><th>MemtoReg</th><th>RegWrite</th><th>MemRead</th><th>MemWrite</th><th>Branch</th><th>ALUOp</th><th>ALU 功能</th><th>ALU Control</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong style="color: #38bdf8;">${currentQuiz.signals.RegDst}</strong></td>
                <td><strong style="color: #38bdf8;">${currentQuiz.signals.ALUSrc}</strong></td>
                <td><strong style="color: #38bdf8;">${currentQuiz.signals.MemtoReg}</strong></td>
                <td><strong style="color: #10b981;">${currentQuiz.signals.RegWrite}</strong></td>
                <td><strong>${currentQuiz.signals.MemRead}</strong></td>
                <td><strong>${currentQuiz.signals.MemWrite}</strong></td>
                <td><strong>${currentQuiz.signals.Branch}</strong></td>
                <td><code>${currentQuiz.signals.ALUOp}</code></td>
                <td><strong>${currentQuiz.aluOpName}</strong></td>
                <td><strong style="color: #a855f7;">${currentQuiz.aluControl}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 輸入輸出與記憶體存取 -->
        <h5 style="color: #10b981; font-size: 0.92rem; margin: 0.75rem 0 0.4rem 0;">2. 運算元資料流與存取行為 (Input / Output / Memory)</h5>
        <div style="background: var(--code-bg); padding: 0.75rem 1rem; border-radius: 4px; font-size: 0.85rem; line-height: 1.7; color: #f8fafc; font-family: var(--font-mono); margin-bottom: 1rem;">
          • 輸入來源：${currentQuiz.inputDesc}<br>
          • 輸出目標：${currentQuiz.outputDesc}<br>
          • 記憶體動作：${currentQuiz.memDesc}
        </div>

        <!-- 核心物理原理深入拆解 -->
        <h5 style="color: #a855f7; font-size: 0.92rem; margin: 0.75rem 0 0.4rem 0;">3. 硬體底層核心原理與防錯邏輯 (重點原理零刪減)</h5>
        <ul style="font-size: 0.88rem; color: var(--text-main); line-height: 1.8; padding-left: 1.25rem; margin: 0;">
          ${currentQuiz.principles.map(p => `<li>${p}</li>`).join("")}
        </ul>
      </div>
    `;

    detailArea.innerHTML = html;
    detailArea.style.display = "block";
    detailArea.scrollIntoView({ behavior: "smooth" });
    if (window.CO_SOLVER && typeof window.CO_SOLVER.renderMath === "function") {
      window.CO_SOLVER.renderMath(detailArea);
    }
  }

  // 靜態展示課堂 4 大原始考題
  function renderStaticExercises(targetContainerId) {
    const target = document.getElementById(targetContainerId);
    if (!target) return;

    const exercises = [
      {
        num: "題目 0 (學號總和 % 4 == 0)",
        inst: "addi $t1, $t2, 5",
        summary: "將暫存器 $t2 的值與立即值 5 相加，結果寫入暫存器 $t1。",
        datapath: [
          "<strong>IF</strong>：自記憶體讀出指令，計算 $PC + 4$。",
          "<strong>ID</strong>：讀出暫存器 <code>$t2</code>（編號 10）之數值；立即值 <code>5</code> 經符號延展單元擴展為 32 位元；RegDst MUX 設為 0，選通 <code>rt</code>（編號 9，即 <code>$t1</code>）作為目的暫存器。",
          "<strong>EX</strong>：ALUSrc MUX 設為 1，選通立即值 5；主 ALU 執行加法運算：<code>Result = R[$t2] + 5</code>。",
          "<strong>MEM</strong>：MemRead = 0, MemWrite = 0，不存取資料記憶體。",
          "<strong>WB</strong>：MemtoReg MUX 設為 0，選通 ALU 運算結果；RegWrite = 1，於時脈正緣寫回暫存器 <code>$t1</code>。"
        ],
        signals: { RegDst: "0", ALUSrc: "1", MemtoReg: "0", RegWrite: "1", MemRead: "0", MemWrite: "0", Branch: "0", ALUOp: "00", ALUControl: "0010 (add)" },
        io: { inputReg: "$t2 (暫存器值)", immediate: "5 (16-bit 立即值)", outputReg: "$t1 (被寫入 R[$t2] + 5)", memAccess: "無存取" }
      },
      {
        num: "題目 1 (學號總和 % 4 == 1)",
        inst: "lw $t1, 8($s2)",
        summary: "自記憶體位址 (R[$s2] + 8) 讀取一個 Word，寫入暫存器 $t1。",
        datapath: [
          "<strong>IF</strong>：自記憶體讀出指令，計算 $PC + 4$。",
          "<strong>ID</strong>：讀出暫存器 <code>$s2</code>（編號 18）之數值；位移量 <code>8</code> 經符號延展為 32 位元；RegDst MUX 設為 0，選通 <code>rt</code>（<code>$t1</code>，編號 9）。",
          "<strong>EX</strong>：ALUSrc MUX 設為 1，選通立即值 8；主 ALU 執行加法計算有效記憶體位址：<code>Effective Address = R[$s2] + 8</code>。",
          "<strong>MEM</strong>：MemRead = 1, MemWrite = 0，自資料記憶體讀取指定位址之資料字組：<code>Mem[R[$s2] + 8]</code>。",
          "<strong>WB</strong>：MemtoReg MUX 設為 1，選通記憶體讀出之資料；RegWrite = 1，於時脈正緣寫回暫存器 <code>$t1</code>。"
        ],
        signals: { RegDst: "0", ALUSrc: "1", MemtoReg: "1", RegWrite: "1", MemRead: "1", MemWrite: "0", Branch: "0", ALUOp: "00", ALUControl: "0010 (add)" },
        io: { inputReg: "$s2 (基底位址)", immediate: "8 (16-bit offset)", outputReg: "$t1 (載入記憶體數值)", memAccess: "讀取位址 R[$s2] + 8" }
      },
      {
        num: "題目 2 (學號總和 % 4 == 2)",
        inst: "sw $t1, 8($s2)",
        summary: "將暫存器 $t1 的值寫入記憶體位址 (R[$s2] + 8)。",
        datapath: [
          "<strong>IF</strong>：自記憶體讀出指令，計算 $PC + 4$。",
          "<strong>ID</strong>：同時讀出基底暫存器 <code>$s2</code> 與待存資料暫存器 <code>$t1</code>；位移量 8 經符號延展為 32 位元；RegWrite = 0，故 RegDst 為 Don't Care (X)。",
          "<strong>EX</strong>：ALUSrc MUX 設為 1，選通立即值 8；主 ALU 執行加法計算有效位址：<code>Effective Address = R[$s2] + 8</code>。",
          "<strong>MEM</strong>：MemWrite = 1, MemRead = 0；將 Read data 2（即 <code>R[$t1]</code>）寫入資料記憶體位址 <code>R[$s2] + 8</code>。",
          "<strong>WB</strong>：RegWrite = 0，不寫回暫存器，MemtoReg 為 Don't Care (X)。"
        ],
        signals: { RegDst: "X", ALUSrc: "1", MemtoReg: "X", RegWrite: "0", MemRead: "0", MemWrite: "1", Branch: "0", ALUOp: "00", ALUControl: "0010 (add)" },
        io: { inputReg: "$s2 (基底位址), $t1 (待寫入數值)", immediate: "8 (16-bit offset)", outputReg: "無暫存器寫入", memAccess: "寫入位址 R[$s2] + 8" }
      },
      {
        num: "題目 3 (學號總和 % 4 == 3)",
        inst: "beq $t1, $t2, Label_Addr (Branch NOT Taken)",
        summary: "比較 $t1 與 $t2，在不相等 (Branch NOT Taken) 的情況下循序執行下一條指令。",
        datapath: [
          "<strong>IF</strong>：自記憶體讀出指令，Adder 1 計算 $PC + 4$。",
          "<strong>ID</strong>：自 Register File 讀出 <code>$t1</code> 與 <code>$t2</code>；16 位元位移量經符號延展並左移 2 位送入分支加法器。",
          "<strong>EX</strong>：ALUSrc MUX 設為 0，選通 <code>$t2</code> 之值；主 ALU 執行減法運算 <code>R[$t1] - R[$t2]</code>。因數值不相等，結果非 0，故 <strong>Zero 旗標輸出 0</strong>。分支加法器計算出跳轉目標位址。",
          "<strong>PCSrc 判定</strong>：<code>PCSrc = Branch AND Zero = 1 AND 0 = 0</code>。PCSrc MUX 選擇 0（即 <strong>PC + 4</strong>）更新 PC，跳轉不發生！",
          "<strong>MEM & WB</strong>：MemRead = 0, MemWrite = 0, RegWrite = 0；RegDst 與 MemtoReg 均為 Don't Care (X)。"
        ],
        signals: { RegDst: "X", ALUSrc: "0", MemtoReg: "X", RegWrite: "0", MemRead: "0", MemWrite: "0", Branch: "1", ALUOp: "01", ALUControl: "0110 (sub)" },
        io: { inputReg: "$t1, $t2 (比較運算元)", immediate: "Label_Addr offset", outputReg: "無暫存器寫入", memAccess: "無記憶體存取", nextPC: "PC + 4 (循序前進)" }
      }
    ];

    let html = `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h3 class="card-title" style="color: #fbbf24;">老師課堂原始 4 大考題全真對照手冊 (投影片第 49-53 頁)</h3>
          <span class="badge badge-warning">課堂抽題標準參考解答</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem; margin-top: 1.25rem;">
    `;

    exercises.forEach(ex => {
      html += `
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 1.25rem; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span class="badge badge-primary">${ex.num}</span>
            <span style="font-family: var(--font-mono); font-weight: 700; color: #38bdf8; font-size: 1.05rem;">${ex.inst}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.5;">${ex.summary}</div>
          <h5 style="color: var(--primary); font-size: 0.88rem; margin: 0.5rem 0 0.3rem 0;">1. 資料路徑階段循序拆解</h5>
          <ul style="font-size: 0.82rem; color: var(--text-main); padding-left: 1.2rem; margin: 0 0 0.75rem 0; line-height: 1.6;">
            ${ex.datapath.map(dp => `<li>${dp}</li>`).join("")}
          </ul>
          <h5 style="color: #10b981; font-size: 0.88rem; margin: 0.5rem 0 0.3rem 0;">2. 完整控制訊號真值表</h5>
          <div style="overflow-x: auto; margin-bottom: 0.75rem;">
            <table class="data-table" style="font-size: 0.75rem; text-align: center;">
              <thead><tr><th>RegDst</th><th>ALUSrc</th><th>MemtoReg</th><th>RegWrite</th><th>MemRead</th><th>MemWrite</th><th>Branch</th><th>ALUOp</th></tr></thead>
              <tbody><tr><td><strong>${ex.signals.RegDst}</strong></td><td><strong>${ex.signals.ALUSrc}</strong></td><td><strong>${ex.signals.MemtoReg}</strong></td><td><strong>${ex.signals.RegWrite}</strong></td><td><strong>${ex.signals.MemRead}</strong></td><td><strong>${ex.signals.MemWrite}</strong></td><td><strong>${ex.signals.Branch}</strong></td><td><code>${ex.signals.ALUOp}</code></td></tr></tbody>
            </table>
          </div>
          <h5 style="color: #a855f7; font-size: 0.88rem; margin: 0.5rem 0 0.3rem 0;">3. 輸入/輸出暫存器與記憶體行為</h5>
          <div style="font-size: 0.8rem; background: var(--code-bg); padding: 0.6rem 0.8rem; border-radius: 4px; color: #f8fafc; line-height: 1.6; font-family: var(--font-mono);">
            • 輸入：${ex.io.inputReg}<br>• 立即值：${ex.io.immediate}<br>• 輸出：${ex.io.outputReg}<br>• 記憶體：${ex.io.memAccess}${ex.io.nextPC ? `<br>• 下一個 PC：${ex.io.nextPC}` : ""}
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    target.innerHTML = html;
    if (window.CO_SOLVER && typeof window.CO_SOLVER.renderMath === "function") {
      window.CO_SOLVER.renderMath(target);
    }
  }

  return {
    renderInspector,
    renderTeacherExerciseLab
  };

})();
