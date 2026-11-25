const OS_DEFAULT_DATA = {
  "chapters": [
    {
      "id": "ch6",
      "title": "CH6 記憶體管理策略（Memory-Management Strategies）",
      "scope": "final",
      "examTips": "基底與界限暫存器硬體保護流程（必考畫圖）、位址繫結三大時期（Compile/Load/Execution）、MMU 動態重定位（必考畫圖）、連續配置三演算法（First/Best/Worst-fit）、50-percent rule 與碎裂、分段硬體架構（必考畫圖）、分頁硬體與位址轉換（必考畫圖）、TLB 分頁查詢流程與 EAT 計算公式（必考畫圖與計算）、Valid-Invalid 位元（必考畫圖）、共享分頁機制（必考畫圖）、兩階分頁架構（必考畫圖）、反向頁表與雜湊頁表（必考畫圖）、Dynamic Loading vs Dynamic Linking（Stub 存根自我替換）、Swapping 傳輸延遲與 Pending I/O 鎖定、PTBR 與 PTLR 暫存器、ASID 防止 TLB 清空、Shared Pages 重入代碼與相同邏輯頁號限制、Slide 51 投影片 1KB 頁面 14-8-10 二階分頁專有考題、64 位元階層分頁失效證明與 Clustered Page Table",
      "sections": [
        {
          "id": "ch6-1",
          "title": "一、 背景觀念與硬體保護機制（Background & Hardware Protection）",
          "summary": "程式必須載入記憶體並置於行程中才能被執行。CPU 與記憶體間必須具備硬體保護，確保使用者行程不會越界破壞其他行程或作業系統核心。",
          "items": [
            {
              "term": "基底與界限暫存器（Base and Limit Registers）",
              "desc": "一對基底（Base）與界限（Limit）暫存器定義了行程的合法邏輯位址空間。\n- 基底暫存器（Base Register）：儲存該行程最小合法的實體記憶體位址（如 300040）。\n- 界限暫存器（Limit Register）：指定該位址範圍的大小長度（如 120900）。\n合法的位址範圍為：[Base, Base + Limit)。"
            },
            {
              "term": "🎨【必考畫圖】基底與界限暫存器硬體位址保護流程圖（Slide 5）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n1. CPU 產生記憶體位址（Address）。<br/>\n2. 判斷一：比較位址是否大於等於基底暫存器（Address >= base）？若否則觸發設陷至作業系統（Trap to OS: addressing error）。<br/>\n3. 判斷二：比較位址是否小於基底加界限（Address < base + limit）？若否則觸發設陷。<br/>\n4. 若皆合法，則該位址直接存取記憶體（Memory）。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_05.png\" alt=\"Hardware Address Protection with Base and Limit Registers\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.1：基底與界限暫存器之硬體保護流程圖（投影片 Slide 5 · 考前必背手繪題）</p></div>"
            },
            {
              "term": "位址繫結三大時期（Address Binding Phases）",
              "desc": "程式從原始碼到位址綁定經歷三個階段：\n1. 編譯時期（Compile Time）：若事先已知程式載入的記憶體位址，生成「絕對代碼（Absolute Code）」。若起始位址改變必須重新編譯。\n2. 載入時期（Load Time）：編譯器產生「可重定位代碼（Relocatable Code）」，載入時期若位址變更，僅需重新載入重定位即可。\n3. 執行時期（Execution Time）：現代作業系統普遍採用。行程在執行期間可以在不同的記憶體區塊間動態移動，必須依賴硬體 MMU 支援。"
            },
            {
              "term": "🎨【必考畫圖】記憶體管理單元（MMU）與動態重定位流程圖（Slide 11）",
              "desc": "<strong>核心觀念：</strong> MMU（Memory-Management Unit）是硬體裝置，負責在執行時期將虛擬/邏輯位址即時轉換為實體位址。<br/>\n<strong>手繪架構要點：</strong><br/>\n- CPU 發出邏輯位址（Logical Address，例如 346）。<br/>\n- 透過硬體加法器（Adder），將邏輯位址加上重定位暫存器（Relocation Register，例如 14000）的值。<br/>\n- 輸出實體位址（Physical Address = 14000 + 346 = 14346）送至主記憶體（Memory）。<br/>\n- 使用者程式永遠只接觸邏輯位址，從不直接看到實體位址。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_11.png\" alt=\"Dynamic relocation using a relocation register\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.2：使用重定位暫存器之動態重定位架構圖（投影片 Slide 11 · 必考畫圖題）</p></div>"
            },
            {
              "term": "調換機制（Swapping）與排程關係",
              "desc": "行程可暫時從主記憶體移出（Swapped out）至備份儲存體（Backing Store），隨後再移回（Swapped in）主記憶體繼續執行。\n- 角色：由中期排程器（Medium-term Scheduler）控制，動態調降多道程式設計程度以舒緩記憶體爭奪。\n- 上下文切換時間的主要成分為搬移記憶體內容的傳輸時間（Transfer Time）。"
            },
            {
              "term": "🎨【必考畫圖】調換機制運作示意圖（Slide 15）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n繪出左側主記憶體（Main Memory：分為 Operating System 與 User Process 空間），與右側備份儲存體（Backing Store）。<br/>\n繪出行程 P1 由記憶體 swap out 至磁碟，與行程 P2 由磁碟 swap in 至主記憶體的雙向箭頭。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_15.png\" alt=\"Schematic View of Swapping\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.3：記憶體調換機制示意圖（投影片 Slide 15）</p></div>"
            },
            {
              "term": "動態載入（Dynamic Loading）之機制與效益",
              "desc": "核心原則：常式（Routine）在被呼叫執行前，絕不預先載入實體記憶體。\n- 透過什麼實作：由程式設計師透過模組化設計自行實作，所有常式以可重定位載入格式存於磁碟。\n- 關鍵優點：完全不需要作業系統核心提供特殊支援（OS 僅提供函式庫輔助）；對於包含大量錯誤處理等低頻常式的大型程式，大幅節省記憶體空間。"
            },
            {
              "term": "動態鏈結（Dynamic Linking）與存根（Stub）自我替換",
              "desc": "靜態鏈結（Static Linking）將所有函式庫直接打包進二進位檔案；動態鏈結將鏈結延後至執行時期。\n- 透過什麼做什麼：透過存根（Stub）定位共用函式庫。\n- Stub 執行流程：Stub 是一小段代碼，首先檢查目標函式庫是否已在記憶體中；若不在則要求 OS 載入；關鍵動作為「Stub 會將自身替換為目標函式庫的真實實體位址（Self-replacement）」後執行常式。\n- 後續呼叫不再經過 Stub，達成零額外負擔的程式庫共享（Shared Libraries，如 .so 與 .dll）。"
            },
            {
              "term": "調換（Swapping）的深層限制、傳輸延遲與 Pending I/O 處置",
              "desc": "1. 換回位置限制：若為編譯/載入期繫結，換出後必須換回原本同一個實體位址；若為執行期動態繫結（搭配 MMU 重定位暫存器），則可換入至任何空閒實體區塊。\n2. 上下文切換時間代價：大部分時間消耗於磁碟傳輸。投影片 Slide 16 計算：100 MB 行程在 50 MB/s 傳輸率下，單次換出耗時 2000 ms，換入再耗時 2000 ms，單次 Context Switch 總耗時高達 4 秒！\n3. Pending I/O 災難與解法：若行程正在進行 I/O 操作被換出，DMA 會直接將資料覆寫至新換入行程的記憶體！解法為：透過 I/O Latching（鎖定正在進行 I/O 的行程禁止調換），或透過 Double Buffering（所有 I/O 僅存取 OS 核心緩衝區，再轉移給使用者）。"
            }
          ]
        },
        {
          "id": "ch6-2",
          "title": "二、 連續記憶體配置與碎裂問題（Contiguous Allocation & Fragmentation）",
          "summary": "將行程放置於單一連續記憶體空間的策略，以及由此產生的外部碎裂、內部碎裂與 50% 規則。",
          "items": [
            {
              "term": "動態儲存配置三大演算法（Dynamic Storage-Allocation Problem）",
              "desc": "當記憶體存在不同大小的空閒洞（Holes）時，滿足大小為 n 的請求的三大策略：\n1. First-Fit（先尋滿足）：自頭開始尋找第一個足夠大的洞。速度最快，儲存利用率佳。\n2. Best-Fit（最佳滿足）：搜尋整個串列，挑選能滿足需求的最小洞。產生最小的剩餘洞。\n3. Worst-Fit（最差滿足）：配置最大的洞，留下最大的剩餘洞。搜尋速度與空間利用率皆最差。"
            },
            {
              "term": "外部碎裂 vs. 內部碎裂（必考對比）",
              "desc": "外部碎裂（External Fragmentation）：可用實體記憶體空間總和足夠滿足新行程需求，但因空間破碎分散為不連續小塊，導致無法分配。\n內部碎裂（Internal Fragmentation）：配置給行程的記憶體區塊略大於其申請的實際大小，區塊內部未被使用的剩餘空間無法分配給他人。"
            },
            {
              "term": "50-Percent Rule（50% 規則數學推導）",
              "desc": "First-fit 演算法統計分析顯示：若系統中已配置 N 個區塊，平均會因外部碎裂損失 0.5 N 個區塊。\n不可用空間佔比公式：\n$$\\text{Unusable Memory} = \\frac{0.5 N}{N + 0.5 N} = \\frac{0.5}{1.5} = \\frac{1}{3} \\approx 33.3\\%$$\n代表有 1/3 的記憶體容量會因為外部碎裂而無法被有效運用！\n解法：壓實（Compaction，僅限執行時期動態重定位）或採用非連續配置（Paging / Segmentation）。"
            }
          ]
        },
        {
          "id": "ch6-3",
          "title": "三、 分段架構（Segmentation Architecture）",
          "summary": "符合程式設計師直觀視野的記憶體管理方式，以邏輯模組（Main, Subroutine, Symbol Table, Stack）為單位配置可變長度區段。",
          "items": [
            {
              "term": "分段邏輯檢視與位址結構",
              "desc": "程式由多個分段組成。二維邏輯位址結構：`<segment-number s, offset d>`。\n分段表（Segment Table）：包含界限（Limit，段長）與基底（Base，該段在實體記憶體的起始位址）。"
            },
            {
              "term": "🔥【老師特別交代 · 100% 一定會考怎麼畫】分段硬體架構圖（Segmentation Hardware · Slide 28）",
              "desc": "<div class=\"alert-box\" style=\"border-left: 4px solid var(--accent-rose); background: rgba(244, 63, 94, 0.1); margin-bottom: 0.75rem; padding: 0.75rem 1rem;\">\n  <strong style=\"color: var(--accent-rose); font-size: 0.95rem;\">⚠️ 考前最高警報：老師課堂特別交代「此圖一定會考怎麼畫」！請務必親手練習手繪至少三次！</strong>\n</div>\n<div style=\"line-height: 1.8; font-size: 0.92rem;\">\n  <strong>【手繪五大必備核心元件與扣分地雷（漏畫必扣分）】：</strong><br/>\n  1. <strong>CPU 邏輯位址暫存器</strong>：必須畫出水平長方形，切分為 <code>s</code>（段號 Segment Number）與 <code>d</code>（頁內位移 Offset）。<br/>\n  2. <strong>段表（Segment Table）</strong>：必須清楚畫出包含兩大欄位：<code>limit</code>（段長）與 <code>base</code>（實體起始基底位址）。<code>s</code> 作為查表索引指針指向段表。<br/>\n  3. <strong>比較器（Comparator <code>&lt;</code>）</strong>：必須拉出一條線將 <code>d</code> 與 <code>limit</code> 接入比較器，並明確標註判斷條件 <code>d &lt; limit</code>：<br/>\n  &nbsp;&nbsp;&nbsp;&nbsp;• <strong>分支 No（若不滿足）</strong>：箭頭必須指向 <strong>trap; addressing error</strong>（位址越界設陷至 OS，考生常漏畫此處而被扣分！）。<br/>\n  &nbsp;&nbsp;&nbsp;&nbsp;• <strong>分支 Yes（若滿足）</strong>：代表存取合法，信號繼續向下傳遞。<br/>\n  4. <strong>硬體加法器（Adder <code>+</code>）</strong>：圓形加法符號，兩端輸入分別為段表查出的 <code>base</code> 與位移 <code>d</code>，進行 <code>base + d</code> 運算。<br/>\n  5. <strong>實體記憶體（Physical Memory）</strong>：加法器輸出的實體位址（Physical Address）直接指向實體記憶體存取。<br/>\n  <br/>\n  <strong>【手繪滿分口訣】：</strong><br/>\n  <span style=\"color: var(--accent-cyan); font-weight: bold; background: rgba(14, 165, 233, 0.15); padding: 0.2rem 0.6rem; border-radius: 4px;\">「s 查段表取 limit 與 base ➔ d 與 limit 先比大小防越界 ➔ 越界 trap 設陷 ➔ 合法 base 加 d 進記憶體」</span>\n</div>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\">\n  <img src=\"images/OS-ch06/slide_28.png\" alt=\"Segmentation Hardware\" style=\"max-width:100%; border-radius:6px; border:2px solid var(--accent-rose); box-shadow:0 4px 16px rgba(244, 63, 94, 0.25);\"/>\n  <p style=\"font-size:0.88rem; color:var(--accent-rose); font-weight:bold; margin-top:0.45rem;\">圖 6.4：分段硬體架構圖（Segmentation Hardware · 投影片 Slide 28 · 老師交代 100% 一定考手繪）</p>\n</div>"
            },
            {
              "term": "🎨【必考畫圖】分段映射實例圖（Slide 29）",
              "desc": "<strong>手繪實例：</strong> 展示段號 0 (subroutine), 段號 1 (sq root), 段號 2 (main), 段號 3 (stack), 段號 4 (symbol table) 透過段表（Base/Limit）映射到實體記憶體不同連續空間的對應關係。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_29.png\" alt=\"Segmentation Example\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.5：分段邏輯空間至實體空間對應實例（投影片 Slide 29）</p></div>"
            }
          ]
        },
        {
          "id": "ch6-4",
          "title": "四、 分頁架構與硬體支援（Paging Architecture & TLB）",
          "summary": "將實體空間切為固定頁框（Frames）、邏輯空間切為同等大小頁面（Pages），徹底根除外部碎裂的核心技術。",
          "items": [
            {
              "term": "分頁位址拆解公式",
              "desc": "若邏輯位址長度為 m 位元，頁面大小為 $2^n$ 位元組：\n- 頁號（Page Number, p）：高 $(m - n)$ 位元，作為頁表索引。\n- 頁內位移（Page Offset, d）：低 $n$ 位元，直接對應至頁框內部偏移。\n實體位址 = (Frame Number f << n) | d。"
            },
            {
              "term": "🎨【必考畫圖】分頁硬體架構圖（Slide 34）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n1. CPU 產生邏輯位址，拆解為 `p`（頁號）與 `d`（位移）。<br/>\n2. 以 `p` 作為索引查詢頁表（Page Table），查出對應的頁框號 `f`。<br/>\n3. 將頁框號 `f` 與原始位移 `d` 拼接（Concatenation），形成實體位址 `f | d`，送入實體記憶體。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_34.png\" alt=\"Paging Hardware\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.6：標準分頁硬體位址轉換架構圖（投影片 Slide 34 · 必考畫圖題）</p></div>"
            },
            {
              "term": "🔥【老師特別交代 · 100% 一定考手繪與計算】具備 TLB 之分頁硬體查詢流程圖（Slide 42）",
              "desc": "<div class=\"alert-box\" style=\"border-left: 4px solid var(--accent-rose); background: rgba(244, 63, 94, 0.1); margin-bottom: 0.75rem; padding: 0.75rem 1rem;\">\n  <strong style=\"color: var(--accent-rose); font-size: 0.95rem;\">⚠️ 考前最高警報：老師課堂特別交代「TLB 一定考！」請務必親手繪製流程圖並熟練 EAT 計算推導！</strong>\n</div>\n<div style=\"line-height: 1.8; font-size: 0.92rem;\">\n  <strong>【核心問題背景】：</strong> 頁表存於主記憶體中，CPU 每次讀取資料皆需存取兩次記憶體（查頁表一次 ＋ 讀取資料一次），效能腰斬。TLB（Translation Look-aside Buffer）為高速硬體關聯快取（Associative Cache），透過並行比對解決此瓶頸。<br/>\n  <br/>\n  <strong>【手繪五大必備核心元件與扣分陷阱（漏畫必扣分）】：</strong><br/>\n  1. <strong>CPU 邏輯位址暫存器</strong>：繪出水平長條，切分為 <code>p</code>（頁號 Page Number）與 <code>d</code>（頁內位移 Offset）。<br/>\n  2. <strong>TLB 關聯快取方塊</strong>：包含 <code>Page #</code> 與 <code>Frame #</code> 兩大欄位，以 <code>p</code> 進行<strong>並行硬體搜尋（Parallel Search）</strong>。<br/>\n  3. <strong>TLB Hit（命中分支 · 僅 1 次記憶體存取）</strong>：直接輸出頁框號 <code>f</code>，與原始位移 <code>d</code> 拼接合成實體位址 <code>f | d</code>，送往實體記憶體讀取資料。<br/>\n  4. <strong>TLB Miss（未命中分支 · 需 2 次記憶體存取）</strong>：<br/>\n  &nbsp;&nbsp;&nbsp;&nbsp;• 訊號必須拉出線條指向主記憶體中的<strong>頁表（Page Table）</strong>，以 <code>p</code> 查出實體頁框號 <code>f</code>。<br/>\n  &nbsp;&nbsp;&nbsp;&nbsp;• <strong>最關鍵扣分陷阱（必畫回填線）</strong>：查得 <code>f</code> 後，必須拉出一條更新箭頭<strong>將新映射條目 <code>&lt;p, f&gt;</code> 寫入更新至 TLB 快取中</strong>（以便下次存取時命中）！考生常漏畫這條回填線而被扣分！<br/>\n  5. <strong>實體記憶體（Physical Memory）</strong>：接收實體位址 <code>f | d</code> 存取真正內容。<br/>\n  <br/>\n  <strong>【手繪滿分口訣】：</strong><br/>\n  <span style=\"color: var(--accent-cyan); font-weight: bold; background: rgba(14, 165, 233, 0.15); padding: 0.2rem 0.6rem; border-radius: 4px;\">「p 查 TLB ➔ 命中直接得 f 拼接 d ➔ 未命中查頁表得 f ➔ 寫回回填更新 TLB ➔ 拼接 d 存取實體記憶體」</span>\n</div>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\">\n  <img src=\"images/OS-ch06/slide_42.png\" alt=\"Paging Hardware With TLB\" style=\"max-width:100%; border-radius:6px; border:2px solid var(--accent-rose); box-shadow:0 4px 16px rgba(244, 63, 94, 0.25);\"/>\n  <p style=\"font-size:0.88rem; color:var(--accent-rose); font-weight:bold; margin-top:0.45rem;\">圖 6.7：具備 TLB 之分頁硬體查詢流程圖（投影片 Slide 42 · 老師交代 100% 一定考手繪與計算）</p>\n</div>"
            },
            {
              "term": "有效存取時間（EAT, Effective Access Time）計算公式（Slide 43）",
              "desc": "公式：$$\\text{EAT} = \\alpha \\times (t_{\\text{TLB}} + t_{\\text{mem}}) + (1 - \\alpha) \\times (t_{\\text{TLB}} + 2 \\times t_{\\text{mem}})$$\n投影片實例：命中率 $\\alpha = 80\\%$，TLB 搜尋時間 $20\\,\\text{ns}$，記憶體存取時間 $100\\,\\text{ns}$：\n$\\text{EAT} = 0.80 \\times 120 + 0.20 \\times 220 = 96 + 44 = 140\\,\\text{ns}$（存取時間慢了 40%）。若命中率升至 98%，$\\text{EAT} = 0.98 \\times 120 + 0.02 \\times 220 = 122\\,\\text{ns}$（僅慢 22%）。"
            },
            {
              "term": "🎨【必考畫圖】頁表有效/無效位元（Valid-Invalid Bit, Slide 45）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n頁表中每一列增加一個 1-bit 欄位：Valid (v) 表示該頁屬於行程的合法位址空間且在記憶體中；Invalid (i) 表示不在記憶體或非法存取。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_45.png\" alt=\"Valid (v) or Invalid (i) Bit In A Page Table\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.8：頁表中 Valid (v) / Invalid (i) 保護位元架構圖（投影片 Slide 45）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】共享分頁（Shared Pages）實例圖（Slide 47）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n展示三個行程 P1, P2, P3 共同執行文字編輯器（ed1, ed2, ed3 為重入代碼 Reentrant Code，唯讀）。<br/>\n三者的頁表將 ed1, ed2, ed3 映射至相同的實體頁框 3, 4, 6；而各行程的私有資料頁（data1, data2, data3）映射至獨立實體頁框 1, 2, 7。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_47.png\" alt=\"Shared Pages Example\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.9：多行程共享分頁實體記憶體映射圖（投影片 Slide 47）</p></div>"
            },
            {
              "term": "頁表控制暫存器：PTBR 與 PTLR",
              "desc": "頁表龐大故置於主記憶體中，硬體透過兩大專用暫存器管理：\n1. PTBR（Page-Table Base Register）：指向目前執行行程頁表的實體基底起始位址。\n2. PTLR（Page-Table Length Register）：記錄該頁表的條目總數長度。\n- 上下文切換時，作業系統只需更換 CPU 內部的 PTBR 與 PTLR 暫存器數值即可完成頁表切換，極度迅速。\n- 位址合法性判定：硬體在查表前首先檢查頁號 p < PTLR；若超出範圍立即觸發設陷（Trap: memory-protection violation）。"
            },
            {
              "term": "透過 ASID（Address-Space Identifier）消除 TLB Flush 開銷",
              "desc": "傳統 TLB 在每次 Context Switch 時必須強制全面清空（Flush），導致新行程啟動初期遭遇嚴重的 TLB Miss。\n- 透過什麼做什麼：透過在每個 TLB 條目中附加 ASID 欄位記錄行程識別碼。\n- 硬體查詢時並行比對頁號 p 與目前行程的 ASID，兩者皆符合才算 TLB Hit。\n- 效益：上下文切換時完全不需要 Flush TLB，多個行程的常用快取分頁可永久共存於 TLB 中。"
            },
            {
              "term": "共享分頁（Shared Pages）之重入代碼與相同邏輯頁號限制",
              "desc": "共用代碼的兩大嚴苛條件：\n1. 必須是重入代碼（Reentrant Code / Pure Code）：唯讀且執行期間絕不自我修改。\n2. 相同邏輯頁號要求：在所有共用行程的邏輯位址空間中，該共享模組通常必須配置在「完全相同的邏輯頁號（Page Number）」，否則涉及絕對跳轉指令時會引發位址錯亂。"
            }
          ]
        },
        {
          "id": "ch6-5",
          "title": "五、 進階頁表結構（Hierarchical, Hashed & Inverted Page Tables）",
          "summary": "解決現代 32/64 位元位址空間下頁表體積過大的進階架構。",
          "items": [
            {
              "term": "🎨【必考畫圖】兩階層頁表與位址轉換架構圖（Slide 50 & 52）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n1. 邏輯位址拆解：32 位元拆解為外層頁號 $p_1$ (10 bits) + 內層頁號 $p_2$ (10 bits) + 位移 $d$ (12 bits)。<br/>\n2. 轉換流程：$p_1$ 查詢外層頁表（Outer Page Table）取得內層頁表基底 -> $p_2$ 查詢內層頁表取得實體頁框號 $f$ -> 拼接 $d$ 存取實體記憶體。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_50.png\" alt=\"Two-Level Page-Table Scheme\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.10：兩階層頁表架構圖（投影片 Slide 50）</p></div><div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_52.png\" alt=\"Address-Translation Scheme\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.11：二階分頁位址轉換流向圖（投影片 Slide 52 · 必考畫圖題）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】雜湊頁表（Hashed Page Table, Slide 56）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n虛擬頁號 p 經過雜湊函數 hash(p)，映射至雜湊表。各槽位為鏈結串列，節點包含 `<virtual page number, frame number, next pointer>`。遍歷比對 p 尋獲後取出 f。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_56.png\" alt=\"Hashed Page Table\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.12：雜湊頁表位址轉換架構圖（投影片 Slide 56）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】反向頁表架構圖（Inverted Page Table, Slide 58）",
              "desc": "<strong>核心觀念：</strong> 全系統僅一張反向頁表，條目數等於實體頁框數。<br/>\n<strong>手繪架構要點：</strong><br/>\n1. CPU 產生邏輯位址 `<pid, p, d>`。<br/>\n2. 搜尋反向頁表：比對哪個條目的 `<pid, p>` 與 CPU 符合？<br/>\n3. 比對成功之列索引即為實體頁框號 `i`。<br/>\n4. 拼接實體位址 `i | d` 存取實體記憶體。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch06/slide_58.png\" alt=\"Inverted Page Table Architecture\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 6.13：反向頁表硬體架構圖（投影片 Slide 58 · 必考手繪圖）</p></div>"
            },
            {
              "term": "⚠️ 投影片 Slide 51 專有數值陷阱：1 KB 頁面之二階分頁位址拆解",
              "desc": "投影片專有範例（常考題）：32 位元機器，頁面大小為 1 KB（2^10 Bytes），PTE 為 4 Bytes。\n- 頁內位移 d 佔 10 位元，總頁號 p 佔 32 - 10 = 22 位元。\n- 限制：各級頁表大小不得超過 1 個頁面大小（1 KB = 1024 Bytes）。\n- 單個內層頁表容納條目數 = 1024 / 4 = 256 = 2^8 個條目，因此內層頁號 p2 佔 8 位元（絕非 10 位元！）。\n- 外層頁號 p1 佔 22 - 8 = 14 位元。\n- 結論：該系統邏輯位址拆解為 14-8-10（p1: 14 bits, p2: 8 bits, d: 10 bits），考生若死記 10-10-12 必全錯！"
            },
            {
              "term": "64 位元位址空間下階層分頁必然失效之數學證明（Slide 53）",
              "desc": "設頁面大小為 4 KB（d 佔 12 位元），分頁號 p 佔 64 - 12 = 52 位元：\n1. 若採兩階分頁：設內層頁表容納 2^10 個條目（佔 1 個頁面），則外層頁號高達 52 - 10 = 42 位元。單單外層頁表本體大小即高達 2^42 * 4 Bytes = 16 TB 的連續記憶體，完全不可行！\n2. 若採三階分頁：設內外各分 10 位元，最外層頁號仍有 52 - 20 = 32 位元，最外層頁表仍需 2^32 * 4 Bytes = 16 GB！\n3. 若增加至四階或五階分頁：單次記憶體存取未命中時需存取 5 至 6 次記憶體，EAT 效能急劇崩潰。\n- 結論：64 位元通用系統必須全面捨棄階層分頁，改採雜湊頁表（Hashed Page Table）或反向頁表（Inverted Page Table）。"
            },
            {
              "term": "叢集頁表（Clustered Page Tables）架構",
              "desc": "雜湊頁表在 64 位元架構下的最佳化變體。\n- 透過什麼做什麼：雜湊表中每個條目不再只映射單一頁面，而是映射一整組相鄰的多個虛擬分頁（如 16 個相鄰分頁）。\n- 適用情境：專為存取記憶體非連續但局部有小群聚特徵的疏鬆位址空間（Sparse Address Space）設計，大幅減少雜湊指標佔用量。"
            }
          ]
        }
      ]
    },
    {
      "id": "ch7",
      "title": "CH7 虛擬記憶體管理（Virtual-Memory Management）",
      "scope": "final",
      "examTips": "虛擬位址空間與堆疊/堆積擴展（必考畫圖）、需求分頁原理、分頁錯誤 Page Fault 處理六大步驟（必考手繪時序圖）、需求分頁 EAT 公式推導、寫入時複製 COW 機制與修改前後對照（必考畫圖）、頁面置換四大演算法（FIFO, Optimal, LRU, Second-Chance / Clock）、貝拉迪異常 Belady's Anomaly 曲線（必考畫圖）、雙向鏈結堆疊記錄 LRU（必考畫圖）、時鐘演算法環形指針圖（必考畫圖）、系統顛簸 Thrashing 與 CPU 利用率暴跌曲線（必考畫圖）、工作集模型 Working-Set Model 與視窗 Delta（必考畫圖）、分頁錯誤頻率 PFF 增減頁框圖（必考畫圖）、伙伴系統 Buddy System 二分分割與合併（必考手繪樹狀圖）、Slab 分配器架構（必考畫圖）",
      "sections": [
        {
          "id": "ch7-1",
          "title": "一、 虛擬記憶體概念與位址空間（Virtual Memory & Address Space）",
          "summary": "將使用者的邏輯記憶體與實體記憶體徹底解耦，允許執行僅部分載入記憶體的程式，支援遠大於實體空間的定址容量。",
          "items": [
            {
              "term": "虛擬記憶體三大效益",
              "desc": "1. 程式大小不再受實體記憶體大小限制。\n2. 每個程式佔用較少實體記憶體，系統可同時執行更多程式，顯著提高 CPU 利用率與吞吐量。\n3. 載入或調換程式所需之 I/O 次數大幅降低，執行更加迅速。"
            },
            {
              "term": "🎨【必考畫圖】虛擬位址空間結構圖（Virtual Address Space, Slide 7）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n繪出由位址 0 開始由底至頂：Code (代碼段) -> Data (資料段) -> Heap (堆積，由下往上動態生長) -> [空白疏鬆位址空間 Sparse Address Space] -> Stack (堆疊，由高位址往下動態生長)。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_07.png\" alt=\"Virtual Address Space\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.1：虛擬位址空間堆疊與堆積擴展圖（投影片 Slide 7 · 必考畫圖題）</p></div>"
            }
          ]
        },
        {
          "id": "ch7-2",
          "title": "二、 需求分頁與分頁錯誤處置（Demand Paging & Page Fault Handling）",
          "summary": "僅在執行需要時才將分頁載入實體頁框，並詳細規範分頁錯誤的硬體設陷與核心六步驟復原處置。",
          "items": [
            {
              "term": "需求分頁與懶惰調換器（Lazy Pager）",
              "desc": "頁面只有在執行被存取時才載入記憶體。若頁面從未被存取，則永遠不會載入實體頁框。頁表透過 Valid-Invalid Bit 標記（v = in memory, i = not in memory）。"
            },
            {
              "term": "🎨【期末核心大題必考畫圖】處理分頁錯誤（Page Fault）六大標準步驟時序圖（Slide 15）",
              "desc": "<strong>考試手繪時序步驟（必背圖）：</strong><br/>\n1. <strong>Step 1 (Reference)：</strong> CPU 存取特定記憶體位址，發現該頁面之 Valid-Invalid Bit 為 i。<br/>\n2. <strong>Step 2 (Trap)：</strong> 硬體 MMU 發出設陷（Trap to OS: page fault）。<br/>\n3. <strong>Step 3 (Locate on Disk)：</strong> 作業系統接管，檢查 PCB 確認存取合法，在備份儲存體（Backing store）中定位該分頁。<br/>\n4. <strong>Step 4 (Bring in Page)：</strong> 排程磁碟 I/O，將頁面載入實體記憶體的一個空閒頁框（Free Frame）。<br/>\n5. <strong>Step 5 (Reset Page Table)：</strong> 磁碟讀取完成中斷，OS 更新頁表條目：將頁框號填入並將 valid bit 改為 <strong>v</strong>。<br/>\n6. <strong>Step 6 (Restart Instruction)：</strong> 恢復行程環境，重新執行原先被中斷的那一道指令（Restart instruction）。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_15.png\" alt=\"Steps in Handling a Page Fault\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.2：處理分頁錯誤六大標準步驟時序圖（投影片 Slide 15 · 期末考 100% 必考手繪大題）</p></div>"
            },
            {
              "term": "需求分頁 EAT 效能公式（Slide 16 & 17）",
              "desc": "設分頁錯誤率為 p ($0 \\le p \\le 1$)，記憶體存取時間 $t_{\\text{mem}} = 200\\,\\text{ns}$，分頁錯誤處理時間為 $8\\,\\text{ms} = 8,000,000\\,\\text{ns}$：\n$$\\text{EAT} = (1 - p) \\times t_{\\text{mem}} + p \\times (\\text{Page Fault Service Time})$$\n$$\\text{EAT} = 200 + 7,999,800 \\times p$$\n若要求效能降低不超過 10%（即 EAT < 220 ns），則 $p < 0.0000025$（每 40 萬次存取只允許發生一次缺頁）。"
            },
            {
              "term": "🎨【必考畫圖】寫入時複製（Copy-on-Write, COW）修改前後對照圖（Slide 21 & 22）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n- 修改前（Slide 21）：Process 1 與 Process 2 呼叫 fork() 後，頁表中同時指向共享的實體頁面 Page A, Page B, Page C。<br/>\n- 修改後（Slide 22）：Process 1 嘗試寫入修改 Page C，硬體觸發保護設陷，作業系統配置全新頁框複製出 `copy of page C`，並更新 Process 1 的頁表指向專屬複本，Process 2 仍指向原 Page C。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_21.png\" alt=\"Before Process 1 Modifies Page C\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.3A：寫入時複製（修改前共享 Page C，投影片 Slide 21）</p></div><div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_22.png\" alt=\"After Process 1 Modifies Page C\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.3B：寫入時複製（修改後複製專屬 Page C，投影片 Slide 22 · 必考手繪圖）</p></div>"
            }
          ]
        },
        {
          "id": "ch7-3",
          "title": "三、 頁面置換演算法與貝拉迪異常（Page Replacement & Belady's Anomaly）",
          "summary": "當實體頁框用罄時選出犧牲頁（Victim Frame）的演算法，重點掌握 FIFO、OPT、LRU、第二次機會時鐘法以及 Belady's Anomaly。",
          "items": [
            {
              "term": "🎨【必考畫圖】基本頁面置換流程圖（Slide 26）",
              "desc": "<strong>手繪流程要點：</strong><br/>\n1. 找到磁碟上所需頁面。<br/>\n2. 尋找空閒頁框；若無空閒頁框，則執行置換演算法選出一個<strong>犧牲頁框（Victim Frame）</strong>。<br/>\n3. 若犧牲頁曾被修改（Dirty Bit = 1），將其寫回磁碟；將其在頁表中的 valid 改為 i。<br/>\n4. 將新頁面載入該頁框，更新頁表為 v。<br/>\n5. 重啟使用者行程。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_26.png\" alt=\"Basic Page Replacement\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.4：基本頁面置換運作流程圖（投影片 Slide 26）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】貝拉迪異常曲線圖（Belady's Anomaly, Slide 29 & 32）",
              "desc": "<strong>手繪座標曲線：</strong><br/>\n- X 軸：Number of frames（頁框數：1, 2, 3, 4, 5, 6...）。<br/>\n- Y 軸：Number of page faults（缺頁次數）。<br/>\n- 正常曲線：隨著頁框數增加，缺頁次數單調遞減。<br/>\n- 貝拉迪異常（FIFO）：在頁框由 3 增加至 4 時，缺頁次數反而從 9 次上升至 10 次，曲線出現<strong>向上凸起的異常波峰</strong>！<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_29.png\" alt=\"Graph of Page Faults Versus The Number of Frames\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.5：缺頁次數與頁框數關係曲線與貝拉迪異常波峰（投影片 Slide 29 · 必考畫圖題）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】雙向鏈結堆疊實作 LRU 頁面記錄圖（Slide 37）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n- 堆疊由頂端（Top，最近存取）至底端（Bottom，最久未存取 LRU page）。<br/>\n- 當頁面已被存取（如 reference to page 7），從堆疊中間抽離該節點，並移至堆疊最頂端。<br/>\n- 透過前後雙向指標（Head/Tail pointers）維護，無須移動陣列元素。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_37.png\" alt=\"Use Of A Stack to Record The Most Recent Page References\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.6：雙向堆疊維護 LRU 存取歷史圖（投影片 Slide 37 · 必考手繪圖）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】第二次機會時鐘演算法環狀圖（Second-Chance / Clock, Slide 39）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n繪出環狀圓形佇列，每個槽位包含 `<Page, Reference bit>`。<br/>\n繪出時鐘指針（Next victim pointer）。<br/>\n運作規則：若指針所指 reference bit = 1，清為 0 並推進指針（給第二次機會）；若為 0，則選為 victim 驅逐替換！<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_39.png\" alt=\"Second-Chance (clock) Page-Replacement Algorithm\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.7：第二次機會時鐘置換演算法環狀掃描圖（投影片 Slide 39 · 必考手繪圖）</p></div>"
            }
          ]
        },
        {
          "id": "ch7-4",
          "title": "四、 系統顛簸、工作集模型與核心記憶體配置（Thrashing & Allocator）",
          "summary": "顛簸成因與 CPU 利用率曲線、局部性原理、工作集模型、PFF 策略，以及 Buddy System 和 Slab Allocator。",
          "items": [
            {
              "term": "🎨【期末核心大題必考畫圖】系統顛簸與 CPU 利用率崩潰曲線（Slide 48 & 49）",
              "desc": "<strong>手繪座標曲線（必背）：</strong><br/>\n- X 軸：Degree of multiprogramming（多道程式設計程度 / 行程數量）。<br/>\n- Y 軸：CPU utilization（CPU 利用率，0% ~ 100%）。<br/>\n- 曲線走向：初期隨行程增加，CPU 利用率穩健上升達峰值；一旦超過臨界點，行程頁框不足頻繁換頁，CPU 利用率<strong>呈現懸崖式垂直急墜暴跌（Thrashing 發生）</strong>！<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_49.png\" alt=\"Demand Paging and Thrashing\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.8：系統顛簸與 CPU 利用率崩潰曲線圖（投影片 Slide 49 · 100% 必考手繪圖）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】工作集模型時鐘視窗圖（Working-Set Model, Slide 51）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n繪出頁面參照串列軸線。<br/>\n繪出工作集視窗 $\\Delta$（如 $\\Delta = 10$ 次存取）。<br/>\n標註時間點 $t_1$ 之工作集：$WS(t_1) = \\{1, 2, 5, 6, 7\\}$；時間點 $t_2$ 之工作集：$WS(t_2) = \\{3, 4\\}$。<br/>\n總需求 $D = \\sum WSS_i$。若 $D > m$（可用頁框總數），系統必然顛簸，必須暫停掛起行程。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_51.png\" alt=\"Working-Set Model\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.9：工作集模型視窗 $\\Delta$ 示意圖（投影片 Slide 51 · 必考手繪圖）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】分頁錯誤頻率（PFF）動態調整圖（Slide 54）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n- Y 軸為 Page-fault rate，X 軸為 Number of frames。<br/>\n- 繪出 Upper bound（上限閥值）與 Lower bound（下限閥值）。<br/>\n- 超過 Upper bound：配置頁框不足，立即為該行程增發頁框（allocate frame）。<br/>\n- 低於 Lower bound：配置過多，自該行程回收多餘頁框（remove frame）。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_54.png\" alt=\"Page-Fault Frequency\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.10：分頁錯誤頻率（PFF）上下限閥值控制圖（投影片 Slide 54）</p></div>"
            },
            {
              "term": "🎨【期末核心大題必考畫圖】伙伴系統配置樹狀圖（Buddy System, Slide 58）",
              "desc": "<strong>手繪二分分割與合併推導：</strong><br/>\n初始區塊為 2 的冪次方（如 256 KB）。<br/>\n請求 21 KB：256 KB 二分為 128K/128K -> 128K 二分為 64K/64K -> 64K 二分為 32K/32K -> 配置一個 32 KB 給請求。<br/>\n釋放時：相鄰且同大小的伙伴（Buddies）進行二分合併（Coalescing），合併為 64K -> 128K -> 256K。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_58.png\" alt=\"Buddy System Allocator\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.11：伙伴系統（Buddy System）記憶體二分分割與合併樹狀圖（投影片 Slide 58 · 必考手繪圖）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】Slab 配置器架構圖（Slab Allocation, Slide 60）",
              "desc": "<strong>手繪架構要點：</strong><br/>\n核心物件快取（Cache，如 semaphores, file objects）包含一個或多個 Slabs。<br/>\n每個 Slab 由一個或多個實體連續頁面組成，劃分為固定大小的 Objects。<br/>\n狀態標註：Full (全滿), Empty (全空), Partial (部分使用)。配置時優先自 Partial slab 派發。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch07/slide_60.png\" alt=\"Slab Allocation\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 7.12：Slab 分配器架構圖（投影片 Slide 60 · 必考畫圖題）</p></div>"
            }
          ]
        }
      ]
    },
    {
      "id": "ch8",
      "title": "CH8 次級儲存系統與磁碟排程（Mass-Storage Systems）",
      "scope": "final",
      "examTips": "移動磁頭磁碟物理構造（必考手繪結構圖：磁柱 Cylinder、磁道 Track、磁區 Sector、磁臂 Arm）、磁碟存取時間三要素（Seek/Latency/Transfer）、NAS vs. SAN 架構對照（必考畫圖）、磁碟排程演算法移動路徑圖與總柱距計算（FCFS, SSTF, SCAN, C-SCAN, C-LOOK 必考手繪折線圖）、RAID 各等級結構圖（RAID 0, 1, 2, 3, 4, 5, 6 必考畫圖）、RAID 0+1 與 RAID 1+0 結構樹對比（必考手繪圖）",
      "sections": [
        {
          "id": "ch8-1",
          "title": "一、 磁碟物理構造與存取效能（Disk Mechanism & Performance）",
          "summary": "傳統機械硬碟的物理構造、旋轉幾何與存取延遲組成分析。",
          "items": [
            {
              "term": "🎨【期末核心必考畫圖】移動磁頭式磁碟物理機械結構圖（Slide 4）",
              "desc": "<strong>手繪硬體四核心元件（必背手繪題）：</strong><br/>\n1. <strong>碟片（Platters）與主軸（Spindle）：</strong> 多片圓盤固定於中心轉軸旋轉（如 5400 / 7200 / 15000 RPM）。<br/>\n2. <strong>磁軌（Track）與磁區（Sector）：</strong> 每個碟盤表面劃分為多條同心圓磁軌，每條磁軌切分為多個磁區（通常為 512 Bytes 或 4 KB）。<br/>\n3. <strong>磁柱（Cylinder）：</strong> 跨越所有碟盤表面上相同半徑位置的所有磁軌集合。<br/>\n4. <strong>讀寫磁頭（Read-Write Heads）與磁臂（Actuator Arm）：</strong> 所有磁頭固定於磁臂組件上，同步內外移動。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_04.png\" alt=\"Moving-head Disk Mechanism\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.1：移動磁頭式磁碟機構物理構造圖（投影片 Slide 4 · 100% 必考手繪大題）</p></div>"
            },
            {
              "term": "磁碟存取時間三大要素",
              "desc": "1. 尋道時間（Seek Time）：磁臂將磁頭移動至目標磁柱柱面之時間（平均約 3~12 ms，佔延遲最大比例）。\n2. 旋轉延遲（Rotational Latency）：磁碟旋轉使目標磁區到達磁頭下方之時間（平均為旋轉半圈時間，7200 RPM 約 4.17 ms）。\n3. 傳輸時間（Transfer Time）：資料在磁碟與主機間傳輸速率。"
            },
            {
              "term": "🎨【必考畫圖】網路連接儲存（NAS）vs. 儲存區域網路（SAN, Slide 13 & 14）",
              "desc": "<strong>手繪對照要點：</strong><br/>\n- NAS（Slide 13）：客戶端透過區域網路（LAN/IP）以 RPC/NFS/CIFS 檔案層級通訊存取專屬 NAS 儲存伺服器。<br/>\n- SAN（Slide 14）：多台伺服器透過高速光纖通道（Fibre Channel）或高速網路交換機，以區塊層級（Block-level）共享底層龐大儲存陣列。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_13.png\" alt=\"Network-Attached Storage\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.2A：網路連接儲存（NAS）架構圖（投影片 Slide 13）</p></div><div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_14.png\" alt=\"Storage Area Network\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.2B：儲存區域網路（SAN）架構圖（投影片 Slide 14 · 必考手繪圖）</p></div>"
            }
          ]
        },
        {
          "id": "ch8-2",
          "title": "二、 磁碟排程演算法手繪路徑對照（Disk Scheduling Algorithms）",
          "summary": "投影片標準範例（柱面 0 ~ 199，初始位置 53，請求序列：98, 183, 37, 122, 14, 124, 65, 67）各演算法手繪移動折線圖。",
          "items": [
            {
              "term": "🎨【必考畫圖】SSTF 最短尋道時間優先移動折線圖（Slide 19）",
              "desc": "<strong>手繪路徑：</strong> 53 -> 65 -> 67 -> 37 -> 14 -> 98 -> 122 -> 124 -> 183。<br/>\n<strong>總尋道柱距：</strong> 236 柱距（比 FCFS 的 640 柱距大幅減少）。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_19.png\" alt=\"SSTF Disk Scheduling\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.3：SSTF 磁頭移動路徑折線圖（投影片 Slide 19 · 必考手繪圖）</p></div>"
            },
            {
              "term": "🎨【期末核心大題必考畫圖】SCAN 電梯演算法移動路徑圖（Slide 21）",
              "desc": "<strong>手繪路徑（朝 0 移動）：</strong> 53 -> 37 -> 14 -> <strong>0（抵達極限端點）</strong> -> 65 -> 67 -> 98 -> 122 -> 124 -> 183。<br/>\n<strong>總尋道柱距：</strong> $(53 - 0) + (183 - 0) = 53 + 183 = \\mathbf{236\\,\\text{柱距}}$。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_21.png\" alt=\"SCAN Disk Scheduling\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.4：SCAN 電梯排程移動路徑折線圖（投影片 Slide 21 · 必考手繪圖）</p></div>"
            },
            {
              "term": "🎨【期末核心大題必考畫圖】C-SCAN 循環電梯演算法移動路徑圖（Slide 23）",
              "desc": "<strong>手繪路徑（朝 199 移動）：</strong> 53 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183 -> <strong>199（端點）</strong> -> <strong>0（飛奔重返起點端點）</strong> -> 14 -> 37。<br/>\n<strong>特點：</strong> 抵達端點後不回程服務，直接直奔另一端點，提供全體磁柱最均勻一致的等待時間！<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_23.png\" alt=\"C-SCAN Disk Scheduling\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.5：C-SCAN 循環電梯排程移動路徑折線圖（投影片 Slide 23 · 必考手繪圖）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】C-LOOK 改進循環排程移動路徑圖（Slide 25）",
              "desc": "<strong>手繪路徑：</strong> 磁頭僅移動至該方向最後一個請求 183，<strong>絕不浪費時間去 199 端點</strong>；回程直接跳回另一側最小請求 14，<strong>絕不浪費時間去 0 端點</strong>。<br/>\n總尋道柱距進一步縮短至 322 柱距。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_25.png\" alt=\"C-LOOK Disk Scheduling\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.6：C-LOOK 磁頭移動路徑折線圖（投影片 Slide 25 · 必考手繪圖）</p></div>"
            }
          ]
        },
        {
          "id": "ch8-3",
          "title": "三、 磁碟陣列架構與容錯技術（RAID Levels & Architecture）",
          "summary": "透過多顆實體磁碟組合達成高吞吐量（條帶化 Striping）與高可靠度（冗餘同位校驗 Parity）。",
          "items": [
            {
              "term": "🎨【期末核心大題必考畫圖】RAID 各等級結構全景圖（Slide 30）",
              "desc": "<strong>手繪各等級磁碟區塊分佈（必背大題）：</strong><br/>\n- <strong>RAID 0：</strong> 區塊條帶化（P0, P1, P2, P3 分散在 Disk 0~3）。無同位碼。<br/>\n- <strong>RAID 1：</strong> 鏡像複製（Disk 0 與 Disk 1 內容完全相同）。<br/>\n- <strong>RAID 4：</strong> 區塊條帶化資料，設立專屬獨立同位檢查碟（Parity Disk P0-3）。缺點為同位碟成為寫入瓶頸。<br/>\n- <strong>RAID 5：</strong> 分散式同位檢查（Distributed Parity），將同位碼 P0、P1、P2 循環交錯分散於各顆硬碟中，空間利用率 $(N-1)/N$。<br/>\n- <strong>RAID 6：</strong> 雙重獨立同位檢查（P + Q），可容忍任意 2 顆硬碟損毀，利用率 $(N-2)/N$。<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_30.png\" alt=\"RAID Levels\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.7：RAID 0, 1, 2, 3, 4, 5, 6 各等級結構佈局圖（投影片 Slide 30 · 期末大題必考手繪圖）</p></div>"
            },
            {
              "term": "🎨【必考畫圖】RAID (0 + 1) 與 RAID (1 + 0) 結構樹對比圖（Slide 31）",
              "desc": "<strong>手繪結構樹對照（重要問答題）：</strong><br/>\n- <strong>RAID 0 + 1（Striped Mirrors）：</strong> 先條帶化成兩組 RAID 0，再對兩組做 RAID 1 鏡像。缺點：若 Disk 0 故障，左側整個 RAID 0 全毀，此時若右側任一顆再故障（如 Disk 2），全系統資料丟失！<br/>\n- <strong>RAID 1 + 0（Mirrored Stripes）：</strong> 先兩兩做 RAID 1 鏡像，再向上條帶化成 RAID 0。優點：只要壞掉的硬碟不是同一鏡像對，最多可容忍 $N/2$ 顆硬碟故障，可靠度遠高於 RAID 0+1！<br/>\n<div class=\"exam-image-box\" style=\"margin-top:0.75rem; text-align:center;\"><img src=\"images/OS-ch08/slide_31.png\" alt=\"RAID (0 + 1) and (1 + 0)\" style=\"max-width:100%; border-radius:6px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.3);\"/><p style=\"font-size:0.85rem; color:var(--text-muted); margin-top:0.35rem;\">圖 8.8：RAID (0+1) vs. RAID (1+0) 樹狀拓撲架構對比圖（投影片 Slide 31 · 必考手繪對比圖）</p></div>"
            }
          ]
        }
      ]
    }
  ],
  "quizQuestions": [
    {
      "id": "q87",
      "chapter": "ch6",
      "type": "single",
      "category": "concept",
      "question": "臨界區間問題（Critical-Section Problem）的三大解決準則中，關於「進展（Progress）」的定義，下列敘述何者正確？",
      "options": [
        "系統必須保證在固定毫秒內完成臨界區內的運算",
        "若無行程在臨界區且有行程欲進入，僅有未在剩餘區執行的行程能參與決策，且不可無限期推遲",
        "任一進入臨界區的行程必須將 CPU 優先權自動提升至最高級別",
        "系統必須保證進入臨界區的次數在所有行程之間絕對嚴格相等"
      ],
      "answer": 1,
      "explanation": "進展準則規定：若無行程在臨界區，僅有那些不在其剩餘區（Remainder Section）的行程能參與決定誰下一個進入臨界區，且此決定不可無限期推遲。",
      "scope": "final"
    },
    {
      "id": "q88",
      "chapter": "ch6",
      "type": "single",
      "category": "concept",
      "question": "在彼得森演算法（Peterson's Algorithm）中，行程 $P_i$ 在進入區執行下列何種程式碼以表明意圖並展現禮讓？",
      "options": [
        "flag[i] = true; turn = j; while (flag[j] && turn == j);",
        "flag[i] = false; turn = i; while (flag[j]);",
        "turn = i; flag[i] = true; while (turn == i);",
        "flag[j] = true; turn = i; while (flag[i] && turn == i);"
      ],
      "answer": 0,
      "explanation": "Pi 先設定自己的 flag[i] = true 表明想進入，接著將 turn 設為對方的編號 j 禮讓對方，最後迴圈檢查若對方也想進且 turn 仍為 j 則等待。",
      "scope": "final"
    },
    {
      "id": "q89",
      "chapter": "ch6",
      "type": "single",
      "category": "concept",
      "question": "關於自旋鎖（Spinlock）的敘述，下列何者「不正確」？",
      "options": [
        "等待鎖時會持續處於忙碌等待（Busy Waiting）狀態，消耗 CPU 週期",
        "在多核心系統中，若臨界區極短，自旋鎖可避免耗時的上下文切換開銷",
        "在單核心單處理器系統中，自旋鎖是最理想且高效的互斥工具",
        "自旋鎖常被用於作業系統核心內部之中斷服務常式或短暫臨界區"
      ],
      "answer": 2,
      "explanation": "在單核心系統中，自旋鎖等待時獨占 CPU 空轉，反而阻止了持有鎖的行程獲得 CPU 釋放鎖，造成完全浪費，因此單核心絕不適合自旋鎖。",
      "scope": "final"
    },
    {
      "id": "q90",
      "chapter": "ch6",
      "type": "single",
      "category": "calc",
      "question": "設一計數號誌（Counting Semaphore）$S$ 的初值設定為 8。在系統執行過程中，共有 13 次 wait(S) 操作與 4 次 signal(S) 操作完成執行。請問此時計數號誌 $S$ 的最終數值為何？此時有多少個行程處於被阻塞（Blocked / Waiting）狀態？",
      "options": [
        "S 的值為 -1，有 1 個行程處於阻塞等待狀態",
        "S 的值為 1，無行程處於阻塞等待狀態",
        "S 的值為 -5，有 5 個行程處於阻塞等待狀態",
        "S 的值為 0，有 0 個行程處於阻塞等待狀態"
      ],
      "answer": 0,
      "explanation": "號誌數值計算公式：$S_{\\text{final}} = S_{\\text{init}} - (\\text{wait 次數}) + (\\text{signal 次數}) = 8 - 13 + 4 = -1$。當採用阻塞佇列時，數值為負數，其絕對值 |-1| = 1 即代表當前被阻塞睡眠的行程數為 1。",
      "scope": "final"
    },
    {
      "id": "q91",
      "chapter": "ch6",
      "type": "single",
      "category": "concept",
      "question": "管程（Monitor）中的條件變數（Condition Variable）x，其 x.signal() 操作與號誌（Semaphore）的 signal() 操作主要差異為何？",
      "options": [
        "x.signal() 會使條件變數計數器加 1，若無行程等待則保留該計數",
        "x.signal() 若無任何行程在 x 上等待，該信號立即消失無痕跡（不具記憶性）；而號誌必會將值加 1",
        "x.signal() 必須在作業系統核心中斷層級執行",
        "x.signal() 無法喚醒被 x.wait() 阻塞的行程"
      ],
      "answer": 1,
      "explanation": "管程的條件變數不具備內部計數器。若執行 x.signal() 時沒有行程掛起在該條件變數上，該次信號完全無效果（No effect）；相反地，號誌的 signal() 必然遞增數值。",
      "scope": "final"
    },
    {
      "id": "q92",
      "chapter": "ch7",
      "type": "single",
      "category": "calc",
      "question": "在有界限緩衝區（Bounded-Buffer）問題中，設緩衝區可容納 10 個資料項目。系統宣告三個號誌：mutex、empty、full。請問這三個號誌的正確初始值分別應設定為多少？",
      "options": [
        "mutex = 0, empty = 10, full = 0",
        "mutex = 1, empty = 0, full = 10",
        "mutex = 1, empty = 10, full = 0",
        "mutex = 1, empty = 10, full = 10"
      ],
      "answer": 2,
      "explanation": "mutex 為提供緩衝區讀寫的二元互斥鎖，初值設為 1；empty 記錄尚可容納的空位數，初值設為 10；full 記錄已有可用資料項目數，初值設為 0。",
      "scope": "final"
    },
    {
      "id": "q93",
      "chapter": "ch7",
      "type": "single",
      "category": "concept",
      "question": "在經典的第一類「讀者-寫者問題（Readers-Writers Problem）」中，當多個讀者與寫者同時競爭時，可能引發何種嚴重的公平性缺陷？",
      "options": [
        "讀者永遠無法讀取到最新資料",
        "寫者會引發系統死結並導致讀者崩潰",
        "寫者面臨無限期飢餓（Writer Starvation）",
        "緩衝區發生內部碎裂"
      ],
      "answer": 2,
      "explanation": "第一類讀者優先機制下，只要目前有讀者在讀取，新到達的讀者即可直接獲准進入。若讀者連續不斷到達，寫者將永遠拿不到 rw_mutex 鎖，陷入無限期飢餓。",
      "scope": "final"
    },
    {
      "id": "q94",
      "chapter": "ch7",
      "type": "single",
      "category": "concept",
      "question": "為了解決「哲學家用餐問題（Dining-Philosophers）」中所有哲學家同時拿起左手筷子引發的循環死結，下列何種策略「無法」打破死結？",
      "options": [
        "最多僅允許 4 位哲學家同時坐在圓桌嘗試進餐",
        "奇數號哲學家先拿左筷再拿右筷，偶數號哲學家先拿右筷再拿左筷",
        "強制規定每位哲學家思考的時間必須完全大於進餐的時間",
        "唯有當哲學家的左右兩隻筷子同時處於空閒時，才允許一併拿起"
      ],
      "answer": 2,
      "explanation": "調整思考時間長短純屬或然率時序改變，無法在數學上打破死結四大必要條件。其他三項分別透過限制資源競爭人數、破壞對稱性打破循環等待、以及破壞持有並等待來嚴密根絕死結。",
      "scope": "final"
    },
    {
      "id": "q95",
      "chapter": "ch7",
      "type": "single",
      "category": "concept",
      "question": "在火星探路者號（Mars Pathfinder）事件中發生的「優先權反轉（Priority Inversion）」問題，作業系統通常採用何種協定徹底解決？",
      "options": [
        "先進先出排程協定（FCFS Protocol）",
        "優先權繼承協定（Priority Inheritance Protocol）",
        "時間片輪轉協定（Round-Robin Protocol）",
        "鴕鳥協定（Ostrich Protocol）"
      ],
      "answer": 1,
      "explanation": "優先權繼承協定規定：當高優先權行程等待低優先權行程持有的資源時，低優先權行程會暫時繼承高優先權的等級，防止被中優先權行程插隊搶占，直到資源釋放。",
      "scope": "final"
    },
    {
      "id": "q96",
      "chapter": "ch8",
      "type": "single",
      "category": "calc",
      "question": "在連續記憶體配置中，記憶體現有五個空閒洞（Holes），依實體位址由小到大順序其大小分別為：150 KB、450 KB、200 KB、350 KB、600 KB。若依序有一行程請求 220 KB 的記憶體空間，請問使用「最佳滿足（Best-Fit）」與「先尋滿足（First-Fit）」演算法，分別會將行程配置在多大的區塊中？",
      "options": [
        "Best-Fit 配置在 350 KB，First-Fit 配置在 450 KB",
        "Best-Fit 配置在 200 KB，First-Fit 配置在 150 KB",
        "Best-Fit 配置在 600 KB，First-Fit 配置在 350 KB",
        "Best-Fit 配置在 450 KB，First-Fit 配置在 450 KB"
      ],
      "answer": 0,
      "explanation": "Best-Fit 尋找大於等於 220 KB 且空間最小的洞：候選有 450, 350, 600 KB，最小者為 350 KB。First-Fit 由前往後搜尋第一個大於等於 220 KB 的洞：150(不夠) -> 450(足夠，直接配置在 450 KB)。故為 350 KB 與 450 KB。",
      "scope": "final"
    },
    {
      "id": "q97",
      "chapter": "ch8",
      "type": "single",
      "category": "calc",
      "question": "某 32 位元邏輯位址系統採用分頁架構（Paging），每個頁面大小設定為 8 KB。請問其邏輯位址中的「頁內偏移（Offset, d）」佔用多少位元？「頁號（Page Number, p）」佔用多少位元？",
      "options": [
        "Offset 佔 12 位元，Page Number 佔 20 位元",
        "Offset 佔 13 位元，Page Number 佔 19 位元",
        "Offset 佔 14 位元，Page Number 佔 18 位元",
        "Offset 佔 16 位元，Page Number 佔 16 位元"
      ],
      "answer": 1,
      "explanation": "頁面大小為 8 KB = 8 * 1024 Bytes = $2^3 \\times 2^{10} = 2^{13}$ 位元組。因此 Offset $d$ 佔用 13 位元。邏輯位址總長 32 位元，故頁號 $p$ 佔用 $32 - 13 = 19$ 位元。",
      "scope": "final"
    },
    {
      "id": "q98",
      "chapter": "ch8",
      "type": "single",
      "category": "calc",
      "question": "某系統主記憶體存取時間為 100 奈秒（ns），TLB 查詢時間為 20 奈秒（ns）。若該系統之 TLB 命中率（Hit Ratio）為 90%，請問其有效記憶體存取時間（Effective Access Time, EAT）為多少奈秒？",
      "options": [
        "110 ns",
        "120 ns",
        "130 ns",
        "140 ns"
      ],
      "answer": 2,
      "explanation": "TLB 命中時所需時間 = $20 + 100 = 120\\,\\text{ns}$。TLB 未命中時需查頁表一次再讀資料一次，所需時間 = $20 + 100 + 100 = 220\\,\\text{ns}$。EAT = $0.90 \\times 120 + (1 - 0.90) \\times 220 = 108 + 22 = 130\\,\\text{ns}$。",
      "scope": "final"
    },
    {
      "id": "q99",
      "chapter": "ch8",
      "type": "single",
      "category": "concept",
      "question": "關於反向頁表（Inverted Page Table）的特性，下列敘述何者「不正確」？",
      "options": [
        "其條目數量取決於實體記憶體的頁框（Frame）數，而非行程的邏輯頁數",
        "能顯著縮減傳統多行程大頁表所佔用的實體記憶體空間",
        "反向頁表能非常天然且輕易地實作多行程間的共用記憶體（Shared Memory）",
        "若無雜湊或關聯快取輔助，反向頁表的線性位址查詢速度較為緩慢"
      ],
      "answer": 2,
      "explanation": "反向頁表每個實體頁框僅對應一筆 <PID, Page Number> 條目，因此當多個行程欲將各自的邏輯頁面映射至同一個共享實體頁框時，反向頁表難以直接表示，共用記憶體實作極為複雜。",
      "scope": "final"
    },
    {
      "id": "q100",
      "chapter": "ch9",
      "type": "single",
      "category": "concept",
      "question": "當 CPU 存取一邏輯頁面，而 MMU 發現該頁對應之頁表條目的有效位元（Valid-Invalid Bit）為 i（無效）時，系統會立即觸發何種硬體中斷或設陷？",
      "options": [
        "分段違規設陷（Segmentation Fault Trap）",
        "分頁錯誤設陷（Page Fault Trap）",
        "死結異常中斷（Deadlock Exception）",
        "計時器逾時中斷（Timer Interrupt）"
      ],
      "answer": 1,
      "explanation": "當存取頁面不在實體記憶體頁框中時，硬體發出分頁錯誤（Page Fault Trap），轉由作業系統核心分頁處理常式自磁碟載入頁面。",
      "scope": "final"
    },
    {
      "id": "q101",
      "chapter": "ch9",
      "type": "single",
      "category": "calc",
      "question": "給定頁面參照串列（Reference String）：1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5。若系統初始給定 3 個空頁框（Frames），採用 FIFO（先進先出）置換演算法，其發生的分頁錯誤（Page Fault）次數為 9 次。若將實體頁框數增加至 4 個，採用 FIFO 演算之缺頁次數反而變為 10 次。此種增加頁框缺頁反增的現象稱為？",
      "options": [
        "護衛效應（Convoy Effect）",
        "貝拉迪異常（Belady's Anomaly）",
        "顛簸效應（Thrashing）",
        "活結現象（Livelock）"
      ],
      "answer": 1,
      "explanation": "在先進先出（FIFO）演算法中，為行程配置更多頁框反而導致缺頁次數增加的反常現象，由 L. Belady 於 1969 年提出，稱為貝拉迪異常（Belady's Anomaly）。",
      "scope": "final"
    },
    {
      "id": "q102",
      "chapter": "ch9",
      "type": "single",
      "category": "calc",
      "question": "給定頁面存取參照串列：7, 0, 1, 2, 0, 3, 0, 4。若實體記憶體配置 3 個頁框且初始皆為空，採用 LRU（最近最少使用）置換演算法，執行完整個序列共產生幾次分頁錯誤（Page Fault）？",
      "options": [
        "5 次",
        "6 次",
        "7 次",
        "8 次"
      ],
      "answer": 1,
      "explanation": "追蹤 LRU 過程：\n7: [7] (Fault 1)\n0: [7, 0] (Fault 2)\n1: [7, 0, 1] (Fault 3)\n2: 最久未用為 7，置換 7 -> [2, 0, 1] (Fault 4)\n0: 命中！更新 0 順序 -> [2, 1, 0] (Hit)\n3: 最久未用為 2，置換 2 -> [3, 1, 0] (Fault 5)\n0: 命中！更新 0 順序 -> [3, 1, 0] (Hit)\n4: 最久未用為 1，置換 1 -> [3, 4, 0] (Fault 6)\n總共發生 6 次 Page Fault。",
      "scope": "final"
    },
    {
      "id": "q103",
      "chapter": "ch9",
      "type": "single",
      "category": "concept",
      "question": "關於作業系統發生「系統顛簸（Thrashing）」現象的根本原因與處置，下列敘述何者正確？",
      "options": [
        "因磁碟讀寫頭損壞導致 I/O 阻塞，應立即重新格式化磁碟",
        "因多道程式設計程度過高，行程配置頁框少於其工作集需求，系統時間全耗費於分頁置換，應調降多道程式設計程度（掛起部分行程）",
        "因 CPU 時脈過高導致記憶體過熱，排程器應降低 CPU 頻率",
        "因演算法未開啟快取，應全面更換為 FIFO 置換"
      ],
      "answer": 1,
      "explanation": "Thrashing 是指行程分配的頁框不足以涵蓋其工作集（Working-Set），導致頻繁缺頁，系統耗盡時間在頁面換入換出，CPU 利用率暴跌。解法為透過中期排程器掛起（Suspend / Swap-out）部分行程，降低多道程式設計程度。",
      "scope": "final"
    },
    {
      "id": "q104",
      "chapter": "ch10",
      "type": "single",
      "category": "calc",
      "question": "磁碟磁柱編號為 0 至 199。磁頭目前位於磁柱 100，且先前的移動方向是朝向磁柱編號「增加」的方向。若磁柱請求佇列依序為：55, 58, 39, 18, 90, 160, 150, 38, 184。若採用 SCAN（電梯演算法），請問磁頭移動的總磁柱距離為何？",
      "options": [
        "200 柱距",
        "280 柱距",
        "248 柱距",
        "344 柱距"
      ],
      "answer": 1,
      "explanation": "SCAN 朝增加方向移動必推進至邊界端點 199：\n磁頭路徑：100 -> 150 -> 160 -> 184 -> 199（抵達邊界）。移動距離 = 199 - 100 = 99。\n隨後反轉方向往 0 推進，依序服務：90 -> 58 -> 55 -> 39 -> 38 -> 18（最後一個請求）。移動距離 = 199 - 18 = 181。\n總移動磁柱距離 = 99 + 181 = 280 柱距。",
      "scope": "final"
    },
    {
      "id": "q105",
      "chapter": "ch10",
      "type": "single",
      "category": "calc",
      "question": "某公司採購了 5 顆容量各為 2 TB 的全新硬碟，欲組建磁碟陣列（RAID）。若將其建置為 RAID 5 架構，請問該陣列實際可供儲存資料的「有效總容量」為多少 TB？該陣列最多可容忍同時損壞幾顆硬碟而不遺失任何資料？",
      "options": [
        "有效容量 10 TB，可容忍 0 顆損壞",
        "有效容量 8 TB，可容忍 1 顆損壞",
        "有效容量 6 TB，可容忍 2 顆損壞",
        "有效容量 5 TB，可容忍 1 顆損壞"
      ],
      "answer": 1,
      "explanation": "RAID 5 採用區塊分散同位檢查，其儲存空間利用率公式為 $(N - 1) \\times C$。5 顆 2 TB 硬碟：有效容量 = $(5 - 1) \\times 2 = 8\\,\\text{TB}$。RAID 5 具備單一校驗碼容錯，最多允許任意 1 顆硬碟損壞。",
      "scope": "final"
    },
    {
      "id": "q106",
      "chapter": "ch10",
      "type": "single",
      "category": "concept",
      "question": "Unix 檔案系統中的 inode 架構採用直接與多層間接區塊指標（Direct, Single/Double/Triple Indirect）。此種設計的主要優勢為何？",
      "options": [
        "杜絕任何磁碟外部碎裂，且小檔案無需額外間接存取開銷，同時又能定址超大型檔案",
        "僅支援磁碟連續配置，速度與光碟相同",
        "所有檔案不論大小皆必須經過三層間接指標查詢",
        "完全取代主記憶體的頁表架構"
      ],
      "answer": 0,
      "explanation": "inode 的混合索引設計：對於小型檔案直接利用 12 個直接指標高速讀取；對於大型檔案則透過單層、雙層、三層間接區塊動態擴展定址容量，兼具存取效能與海量擴充性。",
      "scope": "final"
    },
    {
      "id": "q107",
      "chapter": "ch6",
      "type": "single",
      "category": "concept",
      "question": "硬體原子指令 compare_and_swap(&val, expected, new_val) 的運作邏輯為何？",
      "options": [
        "永遠將 val 更新為 new_val，並回傳 expected",
        "僅當 *val == expected 時才將 *val 更新為 new_val，並回傳 *val 的原始舊值",
        "若 *val != expected 則觸發作業系統當機設陷",
        "將 val 與 expected 兩個整數變數的值進行原子交換"
      ],
      "answer": 1,
      "explanation": "CAS 指令是現代無鎖（Lock-Free）資料結構的基石。其原子地比較記憶體位置的值是否等於 expected，若是則賦予 new_val，並一律回傳記憶體的原始舊值供呼叫者比對判斷是否成功。",
      "scope": "final"
    },
    {
      "id": "q108",
      "chapter": "ch6",
      "type": "single",
      "category": "concept",
      "question": "為什麼在現代多處理器架構中，單純依靠軟體演算法（如未加 Memory Barrier 的 Peterson 演算法）可能無法保證互斥？",
      "options": [
        "因為多核心 CPU 缺乏共享記憶體",
        "因為現代處理器與編譯器會進行指令重排（Instruction Reordering）最佳化",
        "因為單核心的時脈速度遠高於多核心",
        "因為 Peterson 演算法只適用於非對稱多處理系統"
      ],
      "answer": 1,
      "explanation": "現代 CPU 與編譯器為了效能會進行亂序執行（Out-of-order Execution）或指令重排。若無記憶體屏障（Memory Barrier / Fence）強制維護寫入順序，flag 與 turn 的賦值順序可能顛倒，導致互斥性破功。",
      "scope": "final"
    },
    {
      "id": "q109",
      "chapter": "ch7",
      "type": "single",
      "category": "concept",
      "question": "在第一類讀者-寫者問題中，變數 readcount 用於記錄當前正在讀取的讀者人數。程式碼中為何需要 mutex 號誌來保護 readcount？",
      "options": [
        "防止寫者直接修改資料庫",
        "防止多個讀者同時進入圖書館",
        "防止多個讀者同時修改 readcount 引發競爭條件（Race Condition）",
        "防止讀者修改資料項目內容"
      ],
      "answer": 2,
      "explanation": "readcount++ 與 readcount-- 在組合語言層級由多條讀取、修改、寫回指令組成。若無 mutex 互斥保護，多個讀者同時增減將引發競爭條件，導致讀者計數錯誤而誤放寫者進入。",
      "scope": "final"
    },
    {
      "id": "q110",
      "chapter": "ch7",
      "type": "single",
      "category": "concept",
      "question": "在哲學家用餐問題中，若採用「限制最多 4 位哲學家同時嘗試進餐」的解法，其在數學上打破了死結的哪一個必要條件？",
      "options": [
        "互斥條件（Mutual Exclusion）",
        "循環等待條件（Circular Wait）",
        "不可搶佔條件（No Preemption）",
        "持有並等待條件（Hold and Wait）"
      ],
      "answer": 1,
      "explanation": "共有 5 隻筷子，若最多僅准許 4 位哲學家同時搶筷子，根據鴿籠原理（Pigeonhole Principle），至少有一位哲學家能同時取得兩隻筷子進餐並釋放，因此打破了封閉的有向循環等待鏈（Circular Wait）。",
      "scope": "final"
    },
    {
      "id": "q111",
      "chapter": "ch8",
      "type": "single",
      "category": "calc",
      "question": "某 32 位元架構之系統採用單階分頁（Paging），分頁大小為 4 KB，每個頁表條目（PTE）佔用 4 個位元組（Bytes）。若某一行程使用滿全部 4 GB 的邏輯位址空間，請問該行程的頁表（Page Table）本體需佔用多大的實體記憶體空間？",
      "options": [
        "1 MB",
        "2 MB",
        "4 MB",
        "8 MB"
      ],
      "answer": 2,
      "explanation": "總頁數 = $4\\,\\text{GB} / 4\\,\\text{KB} = 2^{32} / 2^{12} = 2^{20} = 1\\,\\text{M}$ 個條目。每個條目佔 4 Bytes，故頁表大小 = $1\\,\\text{M} \\times 4\\,\\text{Bytes} = 4\\,\\text{MB}$。",
      "scope": "final"
    },
    {
      "id": "q112",
      "chapter": "ch8",
      "type": "single",
      "category": "concept",
      "question": "為什麼在分頁系統中完全不存在外部碎裂（External Fragmentation），但仍可能存在內部碎裂（Internal Fragmentation）？",
      "options": [
        "因為頁表使用關聯快取儲存",
        "因為實體記憶體被切分為任意大小的動態分區",
        "因為實體記憶體被嚴格劃分為固定大小頁框，但行程最後一個頁面往往未填滿整個頁框",
        "因為所有程式皆必須以 4 KB 的倍數撰寫"
      ],
      "answer": 2,
      "explanation": "分頁將實體記憶體均分成固定大小頁框，任何空閒頁框皆可直接分配給任何頁面，因此完全不會產生不可用的外部零碎空隙；但行程申請之記憶體通常不是頁面大小的整數倍，最後一頁未用完的空間形成內部碎裂（平均每行程半個頁框）。",
      "scope": "final"
    },
    {
      "id": "q113",
      "chapter": "ch9",
      "type": "single",
      "category": "calc",
      "question": "某虛擬記憶體系統，主記憶體存取時間為 200 奈秒（ns），處理一次分頁錯誤（Page Fault）平均耗時 8 毫秒（ms = 8,000,000 ns）。若要求系統的有效記憶體存取時間（EAT）不超過 280 奈秒，請問系統的分頁錯誤率 p 最高不得超過多少？",
      "options": [
        "十萬分之一（0.00001 即 0.001%）",
        "百萬分之一（0.000001）",
        "萬分之五（0.0005）",
        "千分之一（0.001）"
      ],
      "answer": 0,
      "explanation": "EAT 公式：$EAT = (1 - p) \\times 200 + p \\times 8,000,000 \\le 280$。\n$200 - 200p + 8,000,000p \\le 280 \\implies 7,999,800p \\le 80 \\implies p \\approx 80 / 8,000,000 = 1 / 100,000 = 0.00001$（十萬分之一）。",
      "scope": "final"
    },
    {
      "id": "q114",
      "chapter": "ch9",
      "type": "single",
      "category": "concept",
      "question": "時鐘演算法（Clock Algorithm / 第二次機會演算法）在選擇犧牲頁面時，若指針所指頁面的參照位元（Reference Bit）為 1，演算法會採取何種動作？",
      "options": [
        "立即將該頁寫回磁碟並釋放其頁框",
        "將該參照位元清除為 0，指針前進至下一個頁面繼續檢查",
        "將該頁設為保護狀態並終止行程",
        "將該頁移至工作集視窗頂端"
      ],
      "answer": 1,
      "explanation": "時鐘演算法給予第二次機會：若參照位元為 1，代表近期被存取過，演算法將該位元重置為 0（清除機會），指針推進檢查下一頁框，直到尋獲參照位元為 0 的頁面才作為犧牲者驅逐。",
      "scope": "final"
    },
    {
      "id": "q115",
      "chapter": "ch10",
      "type": "single",
      "category": "calc",
      "question": "某硬碟轉速為 7200 RPM（每分鐘 7200 轉）。請問該硬碟的「平均旋轉延遲（Average Rotational Latency）」大約為多少毫秒（ms）？",
      "options": [
        "2.08 ms",
        "4.17 ms",
        "8.33 ms",
        "12.5 ms"
      ],
      "answer": 1,
      "explanation": "每轉一圈耗時 = $60\\,\\text{s} / 7200 = 1/120\\,\\text{s} \\approx 8.333\\,\\text{ms}$。平均旋轉延遲為旋轉半圈之時間：$8.333 / 2 \\approx 4.17\\,\\text{ms}$。",
      "scope": "final"
    },
    {
      "id": "q116",
      "chapter": "ch10",
      "type": "single",
      "category": "calc",
      "question": "在 Unix inode 檔案結構中，設磁碟區塊大小為 4 KB，區塊指標長度為 4 Bytes。請問一個「單層間接區塊（Single Indirect Block）」最多可指向多少個實體資料區塊？其可涵蓋的資料容量上限為多少？",
      "options": [
        "256 個區塊，1 MB 容量",
        "512 個區塊，2 MB 容量",
        "1024 個區塊，4 MB 容量",
        "2048 個區塊，8 MB 容量"
      ],
      "answer": 2,
      "explanation": "單層間接區塊本身大小為 4 KB = 4096 Bytes。每個區塊指標長 4 Bytes，故可存放 $4096 / 4 = 1024$ 個資料區塊指標。可定址容量 = $1024 \\times 4\\,\\text{KB} = 4096\\,\\text{KB} = 4\\,\\text{MB}$。",
      "scope": "final"
    }
  ],
  "essayQuestions": [
    {
      "id": "essay17",
      "chapter": "ch6",
      "title": "臨界區間三大準則精準定義與 Peterson 演算法數學嚴密證明",
      "category": "design",
      "tags": [
        "CH6",
        "臨界區間",
        "Peterson",
        "互斥證明",
        "有限等待"
      ],
      "question": "臨界區間問題（Critical-Section Problem）是並行程式設計的核心基礎。請深入回答下列問題：\n<br/>\n1. 請給出臨界區問題必須同時滿足的三大準則（Mutual Exclusion, Progress, Bounded Waiting）之精確數學或語意定義。<br/>\n2. 請寫出兩行程彼得森演算法（Peterson's Algorithm）中行程 $P_i$ 的完整進入區（Entry Section）與離開區（Exit Section）虛擬碼，並明確標註各共享變數的初始值。<br/>\n3. 請給出嚴密的數學邏輯證明：證明彼得森演算法如何完全滿足「互斥（Mutual Exclusion）」與「有限等待（Bounded Waiting）」兩大準則。",
      "hint": "注意 turn 變數在記憶體寫入時的原子性；證明有限等待時須分析當 Pj 離開臨界區後重新嘗試進入時 turn 的賦值方向。",
      "answer": "<p><strong>【題解第一部分：臨界區間三大準則定義】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>互斥（Mutual Exclusion）：</strong> 若行程 $P_i$ 目前正在其臨界區內執行，則其他任何行程皆嚴格禁止在其臨界區內執行。</li>\n  <li><strong>進展（Progress / 進步性）：</strong> 當沒有任何行程在其臨界區內執行，且系統中有行程欲進入其臨界區時，只有那些「未在其剩餘區（Remainder Section）執行」的行程具備參與決策的資格，且該選擇行程進入臨界區的決策不可被無限期推遲。</li>\n  <li><strong>有限等待（Bounded Waiting / 界限等待）：</strong> 從一個行程提出進入臨界區的請求（發起申請）開始，直到該請求獲得准許為止，其他行程被准許進入其臨界區的次數必須具備嚴格的上限（Bound），防止任何行程陷入無限期飢餓（Starvation）。</li>\n</ol>\n\n<p><strong>【題解第二部分：Peterson 演算法程式碼】</strong></p>\n<p>共享變數宣告：</p>\n<pre style=\"background: var(--bg-card); padding: 0.8rem; border-radius: 6px;\"><code>boolean flag[2] = {false, false}; // flag[i] = true 表示 Pi 想進入臨界區\nint turn = 0;                     // turn = j 表示當前輪到 Pj 進入</code></pre>\n<p>行程 $P_i$（對應行程為 $P_j$，$j = 1 - i$）之虛擬碼：</p>\n<pre style=\"background: var(--bg-card); padding: 0.8rem; border-radius: 6px;\"><code>do {\n    /* 進入區 (Entry Section) */\n    flag[i] = true;          // 表明自身進入意願\n    turn = j;                // 禮讓：將執行機會先交給對方\n    while (flag[j] && turn == j); // 當對方也想進入且輪到對方時，Pi 忙碌等待\n\n    /* 臨界區 (Critical Section) */\n    // 存取共享資源\n\n    /* 離開區 (Exit Section) */\n    flag[i] = false;         // 釋放意願，宣告退出\n\n    /* 剩餘區 (Remainder Section) */\n    // 執行無關運算\n} while (true);</code></pre>\n\n<p><strong>【題解第三部分：互斥與有限等待證明】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>互斥證明（Proof of Mutual Exclusion）：</strong>\n    <ul>\n      <li>假設 $P_i$ 與 $P_j$ 同時處於臨界區內。</li>\n      <li>行程進入臨界區的唯一條件為其 while 迴圈條件為假，即：\n        <br/>$P_i$ 進入條件：<code>!flag[j] || turn == i</code>\n        <br/>$P_j$ 進入條件：<code>!flag[i] || turn == j</code></li>\n      <li>由於兩者皆在臨界區，故先前皆已執行 <code>flag[i] = true</code> 與 <code>flag[j] = true</code>。因此兩者進入的充要條件必須同時滿足 <code>turn == i</code> 與 <code>turn == j</code>。</li>\n      <li>然而 <code>turn</code> 為單一實體記憶體整數變數，在任何給定瞬間其值不是 0 就是 1，絕不可能同時等於 0 且等於 1！故兩行程絕不可能同時穿透 while 迴圈進入臨界區，互斥性成立。</li>\n    </ul>\n  </li>\n  <li><strong>有限等待證明（Proof of Bounded Waiting）：</strong>\n    <ul>\n      <li>假設 $P_i$ 正在 while 迴圈中等待，此時必有 <code>flag[j] == true</code> 且 <code>turn == j</code>。</li>\n      <li>當 $P_j$ 離開臨界區時，它在離開區必然執行 <code>flag[j] = false</code>。此賦值使 $P_i$ 的 while 條件 <code>flag[j]</code> 瞬間變為假，$P_i$ 得以立即進入臨界區。</li>\n      <li>即使 $P_j$ 離開後以極高速度再次發起申請執行 <code>flag[j] = true</code>，其在進入區必然會執行 <code>turn = i</code>。此操作強行將 turn 寫入為 $i$，使得 $P_j$ 自身陷入等待，而保證 $P_i$ 必定穿透迴圈進入臨界區。</li>\n      <li>因此，$P_i$ 在提出請求後，最多只會等待 $P_j$ 進入一次，等待次數存在嚴格上限 1，滿足有限等待準則。</li>\n    </ul>\n  </li>\n</ol>",
      "rubric": [
        "三大準則（Mutual Exclusion, Progress, Bounded Waiting）定義精準完整（3 分）",
        "Peterson 程式碼結構與 flag、turn 語意正確（3 分）",
        "互斥反證邏輯（turn 不可能同時為 0 與 1）嚴密（4 分）",
        "有限等待證明（上限至多 1 次）推導清楚（4 分）"
      ],
      "scope": "final"
    },
    {
      "id": "essay18",
      "chapter": "ch7",
      "title": "有界限緩衝區生產者-消費者號誌實作與死結反思",
      "category": "design",
      "tags": [
        "CH7",
        "有界限緩衝區",
        "Semaphore",
        "PV操作",
        "死結分析"
      ],
      "question": "有界限緩衝區（Bounded-Buffer）是作業系統中最關鍵的行程通訊模型。請依規範回答下列問題：\n<br/>\n1. 請宣告實作此模型所需的全部號誌（Semaphores）及其精確初始數值與物理意義（假設緩衝區大小為 $N$）。<br/>\n2. 請寫出生產者（Producer）與消費者（Consumer）的完整標準執行迴圈虛擬碼。<br/>\n3. 若某程式設計師不慎將生產者程式碼中的兩道 wait 操作順序對調，改寫為：\n<pre><code>wait(mutex);\nwait(empty);</code></pre>\n請詳細推導演算法在何種特定邊界情況下會引發系統全域死結（Deadlock）？此時消費者與生產者各自卡在何種狀態？",
      "hint": "死結發生於緩衝區已全滿（empty == 0）的情境，分析持鎖與等待資源的相互依賴關係。",
      "answer": "<p><strong>【題解第一部分：號誌宣告與物理意義】</strong></p>\n<ul>\n  <li><code>semaphore mutex = 1;</code>：二元號誌（互斥鎖），保護對共享緩衝區池內部指標（in, out, buffer）操作的互斥性。</li>\n  <li><code>semaphore empty = N;</code>：計數號誌，記錄當前緩衝區中尚可容納項目的「空閒槽位數量」。初始值為緩衝區總容量 $N$。</li>\n  <li><code>semaphore full = 0;</code>：計數號誌，記錄當前緩衝區中已被生產、可供消費的「有效資料項目數量」。初始值為 0。</li>\n</ul>\n\n<p><strong>【題解第二部分：標準生產者與消費者虛擬碼】</strong></p>\n<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;\">\n<div>\n<p><strong>生產者（Producer）：</strong></p>\n<pre style=\"background: var(--bg-card); padding: 0.8rem; border-radius: 6px;\"><code>do {\n    item next_produced = produce_item();\n\n    wait(empty); // 1. 先申請空位\n    wait(mutex); // 2. 再取得互斥鎖\n\n    // 將 next_produced 放入緩衝區\n    add_to_buffer(next_produced);\n\n    signal(mutex); // 3. 釋放互斥鎖\n    signal(full);  // 4. 增加可用項目計數\n} while (true);</code></pre>\n</div>\n<div>\n<p><strong>消費者（Consumer）：</strong></p>\n<pre style=\"background: var(--bg-card); padding: 0.8rem; border-radius: 6px;\"><code>do {\n    wait(full);  // 1. 先確認有資料可取\n    wait(mutex); // 2. 再取得互斥鎖\n\n    // 從緩衝區取出項目\n    item next_consumed = remove_from_buffer();\n\n    signal(mutex); // 3. 釋放互斥鎖\n    signal(empty); // 4. 釋放空位計數\n\n    consume_item(next_consumed);\n} while (true);</code></pre>\n</div>\n</div>\n\n<p><strong>【題解第三部分：PV 順序顛倒引發死結之推導】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>觸發邊界情境：</strong> 當緩衝區已經被填滿，即 <code>empty == 0</code> 且 <code>full == N</code> 時。</li>\n  <li><strong>推導過程：</strong>\n    <ul>\n      <li>此時生產者欲再加入新項目，先執行 <code>wait(mutex)</code>。因為 mutex 原為 1，生產者成功將 mutex 減為 0，順利取得緩衝區互斥鎖。</li>\n      <li>緊接著生產者執行 <code>wait(empty)</code>。由於此時 <code>empty == 0</code>，生產者無法取得空位，因此被作業系統掛起並進入 <code>empty</code> 號誌的阻塞等待佇列中睡眠。</li>\n      <li><strong>關鍵致命點：</strong> 生產者在進入睡眠時，<strong>身上仍然死死持有 <code>mutex</code> 互斥鎖，未曾釋放</strong>！</li>\n      <li>隨後消費者欲取用項目以騰出空間，消費者執行 <code>wait(full)</code> 順利通過（因為 full = N > 0）；接著消費者執行 <code>wait(mutex)</code>。</li>\n      <li>由於 <code>mutex</code> 目前為 0 且被睡眠中的生產者持有，消費者立即被阻塞在 <code>mutex</code> 的等待佇列中！</li>\n    </ul>\n  </li>\n  <li><strong>死結結果：</strong> 生產者持有 <code>mutex</code> 正在等待消費者發出 <code>signal(empty)</code>；而消費者需要取得 <code>mutex</code> 才能消費並發出 <code>signal(empty)</code>。兩者形成互相死鎖等待（Circular Wait），系統永久凍結！</li>\n</ol>",
      "rubric": [
        "三個號誌宣告、初始值與代表意義正確（3 分）",
        "生產者與消費者標準虛擬碼邏輯正確（4 分）",
        "顛倒順序引發死結的特定情境（Buffer 滿）指明（2 分）",
        "死結推導鏈結（持鎖睡眠導致消費者無法進場）論述透徹（5 分）"
      ],
      "scope": "final"
    },
    {
      "id": "essay19",
      "chapter": "ch8",
      "title": "分頁記憶體架構 TLB 有效存取時間 EAT 數學建模與兩階分頁深度推導",
      "category": "calc",
      "tags": [
        "CH8",
        "Paging",
        "TLB",
        "EAT",
        "有效存取時間",
        "二階分頁"
      ],
      "question": "記憶體階層與分頁（Paging）是現代處理器的核心基石。請詳細解答下列兩大子題：\n<br/>\n1. 假設某單階分頁系統中，主記憶體存取時間為 $t_{\\text{mem}} = 100\\,\\text{ns}$，硬體 TLB 查詢時間為 $t_{\\text{TLB}} = 15\\,\\text{ns}$。請寫出有效記憶體存取時間（EAT）以 TLB 命中率 $\\alpha$ 為變數的通用數學公式。若欲使系統的 EAT 壓低在 $125\\,\\text{ns}$ 以內，請問該系統硬體 TLB 的命中率 $\\alpha$ 最低必須達到多少？<br/>\n2. 某 32 位元機器採用兩階分頁（Two-level Paging），實體記憶體存取時間為 $100\\,\\text{ns}$，TLB 查詢時間為 $15\\,\\text{ns}$。當發生「TLB 未命中（TLB Miss）」時，請逐步推導 CPU 總共需存取幾次實體記憶體？計算單次 TLB Miss 的完整存取耗時。若 TLB 命中率為 95%，計算此兩階分頁系統的最終 EAT。",
      "hint": "注意兩階分頁在 TLB Miss 時需要存取兩次頁表（外層頁表 + 內層頁表）再加上最後一次真實資料存取，共 3 次主記憶體存取。",
      "answer": "<p><strong>【題解第一部分：單階分頁 EAT 數學推導與命中率要求】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>單階分頁存取時間拆解：</strong>\n    <ul>\n      <li><strong>TLB 命中（Hit）：</strong> 在 TLB 中直接查得頁框號，僅需一次主記憶體資料讀取：\n        <br/>$T_{\\text{hit}} = t_{\\text{TLB}} + t_{\\text{mem}} = 15 + 100 = 115\\,\\text{ns}$。</li>\n      <li><strong>TLB 未命中（Miss）：</strong> TLB 查無條目，需先存取一次記憶體中的頁表取得頁框號，再存取一次記憶體讀取真實資料：\n        <br/>$T_{\\text{miss}} = t_{\\text{TLB}} + 2 \\times t_{\\text{mem}} = 15 + 200 = 215\\,\\text{ns}$。</li>\n    </ul>\n  </li>\n  <li><strong>EAT 數學通式：</strong>\n    $$\\text{EAT} = \\alpha \\times (t_{\\text{TLB}} + t_{\\text{mem}}) + (1 - \\alpha) \\times (t_{\\text{TLB}} + 2 \\times t_{\\text{mem}})$$\n    $$\\text{EAT} = \\alpha \\times 115 + (1 - \\alpha) \\times 215 = 215 - 100\\alpha\\,\\text{ns}$$</li>\n  <li><strong>求解最低命中率 $\\alpha$：</strong>\n    依題意要求 $\\text{EAT} \\le 125\\,\\text{ns}$：\n    $$215 - 100\\alpha \\le 125 \\implies 100\\alpha \\ge 90 \\implies \\alpha \\ge 0.90\\; (90\\%)$$ \n    <strong>結論：</strong> 該系統的 TLB 命中率最低必須達到 <strong>90%</strong>。</li>\n</ol>\n\n<p><strong>【題解第二部分：兩階分頁 TLB Miss 與 EAT 計算】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>兩階分頁 TLB Miss 記憶體存取次數推導：</strong>\n    <ul>\n      <li>第 1 次記憶體存取：根據外層頁號（Outer Page Number, $p_1$）存取「外層頁表」，查得內層頁表所在的實體基底位址。</li>\n      <li>第 2 次記憶體存取：根據內層頁號（Inner Page Number, $p_2$）存取「內層頁表」，查得該頁對應的實體頁框號（Frame Number, $f$）。</li>\n      <li>第 3 次記憶體存取：結合頁框號 $f$ 與偏移量 $d$，存取目標實體位址讀取真正的指令或資料。</li>\n      <li><strong>總結：</strong> 單次 TLB Miss 總共需要存取 <strong>3 次主記憶體</strong>！</li>\n    </ul>\n  </li>\n  <li><strong>兩階分頁各項延遲計算：</strong>\n    <ul>\n      <li>$T_{\\text{hit}} = t_{\\text{TLB}} + t_{\\text{mem}} = 15 + 100 = 115\\,\\text{ns}$</li>\n      <li>$T_{\\text{miss}} = t_{\\text{TLB}} + 3 \\times t_{\\text{mem}} = 15 + 300 = 315\\,\\text{ns}$</li>\n    </ul>\n  </li>\n  <li><strong>計算最終 EAT（$\\alpha = 95\\%$）：</strong>\n    $$\\text{EAT} = 0.95 \\times 115 + (1 - 0.95) \\times 315 = 109.25 + 0.05 \\times 315 = 109.25 + 15.75 = \\mathbf{125.0\\,\\text{ns}}$$\n    <strong>結論：</strong> 兩階分頁在 95% 命中率下的有效存取時間為 <strong>125 ns</strong>。</li>\n</ol>",
      "rubric": [
        "單階分頁 EAT 公式推導正確（3 分）",
        "解出最低命中率 90% 正確（3 分）",
        "兩階分頁 TLB Miss 需 3 次記憶體存取之階層拆解說明清晰（4 分）",
        "兩階分頁 EAT 數值（125 ns）計算正確（4 分）"
      ],
      "scope": "final"
    },
    {
      "id": "essay20",
      "chapter": "ch9",
      "title": "頁面置換演算法綜合對決：FIFO、OPT、LRU 追蹤與貝拉迪異常數學本質",
      "category": "calc",
      "tags": [
        "CH9",
        "頁面置換",
        "FIFO",
        "LRU",
        "OPT",
        "Belady's Anomaly",
        "堆疊演算法"
      ],
      "question": "頁面置換演算法是虛擬記憶體管理效能的核心。請回答下列問題：\n<br/>\n1. 給定頁面存取參照串列如下：\n$$\\mathbf{1,\\; 2,\\; 3,\\; 4,\\; 2,\\; 1,\\; 5,\\; 6,\\; 2,\\; 1}$$\n假設實體記憶體分配 $\\mathbf{3}$ 個空頁框（Frame），請分別推導並逐步寫出使用 **(a) FIFO**、**(b) Optimal (OPT)** 以及 **(c) LRU** 三種演算法的置換歷程，並統計各自產生的分頁錯誤（Page Fault）總次數。<br/>\n2. 什麼是貝拉迪異常（Belady's Anomaly）？為什麼 LRU 演算法在數學上保證絕不可能發生貝拉迪異常？請以「堆疊演算法（Stack Algorithm）」的包含性質（Inclusion Property）進行理論證明。",
      "hint": "堆疊演算法滿足：在任意時間點 t，分配 n 個頁框所持有的頁面集合 B(t, n) 必為分配 n+1 個頁框所持有集合 B(t, n+1) 的真子集。",
      "answer": "<p><strong>【題解第一部分：三種演算法逐步追蹤（3 頁框）】</strong></p>\n<p>參照串列：$1, 2, 3, 4, 2, 1, 5, 6, 2, 1$（共 10 次存取）</p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>(a) FIFO 演算法（先進先出）：</strong>\n    <ul>\n      <li>1: [1, -, -] -> Fault (1)</li>\n      <li>2: [1, 2, -] -> Fault (2)</li>\n      <li>3: [1, 2, 3] -> Fault (3)</li>\n      <li>4: 最早為 1，置換 1 -> [4, 2, 3] -> Fault (4)</li>\n      <li>2: 命中 [4, 2, 3] -> Hit</li>\n      <li>1: 最早為 2，置換 2 -> [4, 1, 3] -> Fault (5)</li>\n      <li>5: 最早為 3，置換 3 -> [4, 1, 5] -> Fault (6)</li>\n      <li>6: 最早為 4，置換 4 -> [6, 1, 5] -> Fault (7)</li>\n      <li>2: 最早為 1，置換 1 -> [6, 2, 5] -> Fault (8)</li>\n      <li>1: 最早為 5，置換 5 -> [6, 2, 1] -> Fault (9)</li>\n      <li><strong>FIFO 總缺頁次數：9 次</strong>（命中 1 次）。</li>\n    </ul>\n  </li>\n  <li><strong>(b) Optimal (OPT) 演算法（看未來）：</strong>\n    <ul>\n      <li>1: [1, -, -] -> Fault (1)</li>\n      <li>2: [1, 2, -] -> Fault (2)</li>\n      <li>3: [1, 2, 3] -> Fault (3)</li>\n      <li>4: 未來存取：2(下步), 1(下下步), 3(未來再也不用)。驅逐 3 -> [1, 2, 4] -> Fault (4)</li>\n      <li>2: 命中 [1, 2, 4] -> Hit</li>\n      <li>1: 命中 [1, 2, 4] -> Hit</li>\n      <li>5: 未來存取：6, 2, 1，4 未來再也不用。驅逐 4 -> [1, 2, 5] -> Fault (5)</li>\n      <li>6: 未來存取：2, 1，5 未來再也不用。驅逐 5 -> [1, 2, 6] -> Fault (6)</li>\n      <li>2: 命中 [1, 2, 6] -> Hit</li>\n      <li>1: 命中 [1, 2, 6] -> Hit</li>\n      <li><strong>OPT 總缺頁次數：6 次</strong>（理論最低缺頁率）。</li>\n    </ul>\n  </li>\n  <li><strong>(c) LRU 演算法（看過去最久未用）：</strong>\n    <ul>\n      <li>1: [1, -, -] -> Fault (1)</li>\n      <li>2: [1, 2, -] -> Fault (2)</li>\n      <li>3: [1, 2, 3] -> Fault (3)</li>\n      <li>4: 過去使用順序 [1, 2, 3]，最久未用為 1。置換 1 -> [4, 2, 3] -> Fault (4)</li>\n      <li>2: 命中！更新後順序由久至近：(3, 4, 2) -> Hit</li>\n      <li>1: 最久未用為 3，置換 3 -> [4, 2, 1]，順序：(4, 2, 1) -> Fault (5)</li>\n      <li>5: 最久未用為 4，置換 4 -> [5, 2, 1]，順序：(2, 1, 5) -> Fault (6)</li>\n      <li>6: 最久未用為 2，置換 2 -> [6, 1, 5]，順序：(1, 5, 6) -> Fault (7)</li>\n      <li>2: 最久未用為 1，置換 1 -> [2, 5, 6]，順序：(5, 6, 2) -> Fault (8)</li>\n      <li>1: 最久未用為 5，置換 5 -> [1, 6, 2]，順序：(6, 2, 1) -> Fault (9)</li>\n      <li><strong>LRU 總缺頁次數：8 次</strong>。</li>\n    </ul>\n  </li>\n</ol>\n\n<p><strong>【題解第二部分：貝拉迪異常與堆疊演算法證明】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>貝拉迪異常（Belady's Anomaly）定義：</strong> 在特定頁面置換演算法（如 FIFO）中，為系統配置更多實體頁框（Frames）時，分頁錯誤（Page Fault）次數不降反增的非預期異常現象。</li>\n  <li><strong>堆疊演算法（Stack Algorithm）定義與包含性：</strong>\n    <ul>\n      <li>若一個頁面置換演算法保證：在任何時間點 $t$，配置 $n$ 個頁框時駐留在記憶體中的頁面集合 $B(t, n)$，永遠是配置 $n+1$ 個頁框時駐留頁面集合 $B(t, n+1)$ 的子集，即：\n        $$B(t, n) \\subseteq B(t, n+1)$$\n        則該演算法被嚴格定義為「堆疊演算法」。</li>\n    </ul>\n  </li>\n  <li><strong>LRU 絕不發生異常之數學證明：</strong>\n    <ul>\n      <li>在 LRU 演算法中，集合 $B(t, n)$ 定義為「在時間點 $t$ 之前最近被存取的 $n$ 個相異頁面集合」。</li>\n      <li>顯然地，最近存取的 $n$ 個相異頁面，必然完全包含於最近存取的 $n+1$ 個相異頁面之中。即對於任意 $t$ 與 $n$，永遠嚴格滿足 $B(t, n) \\subseteq B(t, n+1)$。</li>\n      <li>因此，若存取某一頁面在 $n+1$ 個頁框下發生命中（$p \\in B(t, n+1)$），它在 $n$ 個頁框下未必命中；但在 $n$ 個頁框下若能命中（$p \\in B(t, n)$），在 $n+1$ 個頁框下則<strong>必然命中</strong>！</li>\n      <li>故增加頁框數只會讓命中次數單調遞增（或持平），缺頁次數必然單調遞減，數學上絕對不可能發生貝拉迪異常！</li>\n    </ul>\n  </li>\n</ol>",
      "rubric": [
        "FIFO 追蹤步驟與缺頁次數 9 次計算正確（3 分）",
        "OPT 追蹤步驟與缺頁次數 6 次計算正確（3 分）",
        "LRU 追蹤步驟與缺頁次數 8 次計算正確（3 分）",
        "貝拉迪異常定義精準（2 分）",
        "堆疊演算法包含性數學子集定義與 LRU 免疫證明透徹（3 分）"
      ],
      "scope": "final"
    },
    {
      "id": "essay21",
      "chapter": "ch10",
      "title": "磁碟排程演算法尋道計算與 RAID 磁碟陣列全等級架構矩陣橫向對比",
      "category": "calc",
      "tags": [
        "CH10",
        "磁碟排程",
        "SSTF",
        "SCAN",
        "C-SCAN",
        "RAID",
        "容錯比較"
      ],
      "question": "次級儲存與高可用儲存架構是作業系統期末考的大題重鎮。請回答下列兩題：\n<br/>\n1. 某磁碟共有 200 個磁柱（編號 0 ~ 199），當前磁頭位於 **53**，且正朝向柱號「減少」的方向移動。磁柱請求佇列如下：\n$$\\mathbf{98,\\; 183,\\; 37,\\; 122,\\; 14,\\; 124,\\; 65,\\; 67}$$\n請分別繪出或詳細推導寫出下列演算法的磁頭移動順序，並計算各自的**總尋道磁柱距離（Total Head Movement）**：\n  - (a) **SSTF（最短尋道時間優先）**\n  - (b) **SCAN（電梯演算法）**\n  - (c) **C-SCAN（循環電梯演算法）**<br/>\n2. 請以結構化矩陣全面比較 **RAID 0, RAID 1, RAID 5, RAID 6** 四大架構在：(1) 空間利用率公式（設硬碟數為 $N$，單碟容量 $C$）、(2) 最大容錯硬碟損壞數、(3) 隨機寫入同位檢查開銷（Write Penalty）三面向之精確表現。",
      "hint": "注意磁頭起始移動方向為減少（朝向 0）；SCAN 必須移動至端點 0 再折返；C-SCAN 抵達端點 0 後瞬間直奔另一極端點 199 再往回掃描。",
      "answer": "<p><strong>【題解第一部分：磁碟排程移動路徑與總柱距計算】</strong></p>\n<p>起始位置：53，方向：朝 0 移動。請求佇列排序：14, 37, 65, 67, 98, 122, 124, 183。</p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>(a) SSTF（最短尋道優先）：</strong>\n    <ul>\n      <li>由 53 出發，距離最近者依序選取：\n        <br/>53 -> 65 (距12) -> 67 (距2) -> 37 (距30) -> 14 (距23) -> 98 (距84) -> 122 (距24) -> 124 (距2) -> 183 (距59)。</li>\n      <li>總移動距離 = $12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = \\mathbf{236\\,\\text{柱距}}$。</li>\n    </ul>\n  </li>\n  <li><strong>(b) SCAN（電梯演算法，朝 0 移動）：</strong>\n    <ul>\n      <li>磁頭沿減少方向前進，依序服務小於 53 之請求，並推進至實體端點 0：\n        <br/>53 -> 37 -> 14 -> <strong>0（抵達極限端點）</strong>。移動距離 = $53 - 0 = 53$。\n      </li>\n      <li>抵達 0 後反轉方向朝 199 推進，依序服務剩餘請求：\n        <br/>0 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183（最後請求）。移動距離 = $183 - 0 = 183$。\n      </li>\n      <li>總尋道距離 = $53 + 183 = \\mathbf{236\\,\\text{柱距}}$。</li>\n    </ul>\n  </li>\n  <li><strong>(c) C-SCAN（循環電梯演算法，朝 0 移動）：</strong>\n    <ul>\n      <li>磁頭沿減少方向服務至端點 0：\n        <br/>53 -> 37 -> 14 -> <strong>0（端點）</strong>。移動距離 = $53 - 0 = 53$。\n      </li>\n      <li>抵達 0 後不反向服務，而是直接飛奔至另一側端點 <strong>199</strong>：\n        <br/>移動距離 = $199 - 0 = 199$。\n      </li>\n      <li>從 199 繼續朝減少方向服務剩餘較大請求：\n        <br/>199 -> 183 -> 124 -> 122 -> 98 -> 67 -> 65（最後請求）。移動距離 = $199 - 65 = 134$。\n      </li>\n      <li>總尋道距離 = $53 + 199 + 134 = \\mathbf{386\\,\\text{柱距}}$（若題目定義返回不計柱距則為 $53 + 134 = 187$ 柱距，標準教科書計算包含全部移動總和為 386 柱距）。</li>\n    </ul>\n  </li>\n</ol>\n\n<p><strong>【題解第二部分：RAID 四大架構深度矩陣對照】</strong></p>\n<div style=\"overflow-x: auto;\">\n<table class=\"comparison-table\">\n  <thead>\n    <tr>\n      <th>RAID 等級</th>\n      <th>空間利用率公式 ($N$ 碟，單碟 $C$)</th>\n      <th>最大容錯損壞磁碟數</th>\n      <th>隨機小寫入懲罰 (Write Penalty)</th>\n      <th>核心架構特點與實務應用</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td><strong>RAID 0<br/>(Striping)</strong></td>\n      <td>$N \\times C$ (100%)</td>\n      <td>0 顆 (無容錯)</td>\n      <td>無懲罰 (單次寫入)</td>\n      <td>純資料分散條帶化，無同位檢查碼。讀寫吞吐極限，但任一碟損壞全體陣列崩潰。適用於暫存、高效能運算。</td>\n    </tr>\n    <tr>\n      <td><strong>RAID 1<br/>(Mirroring)</strong></td>\n      <td>$\\frac{N}{2} \\times C$ (50%)</td>\n      <td>$N - 1$ 顆 (同鏡像組至多1顆)</td>\n      <td>需寫入 2 顆硬碟</td>\n      <td>完整鏡像拷貝，可靠度最高且讀取可負載平衡。空間利用率最低且硬體成本高昂。適用於系統磁碟與核心交易日誌。</td>\n    </tr>\n    <tr>\n      <td><strong>RAID 5<br/>(Distributed Parity)</strong></td>\n      <td>$(N - 1) \\times C$ ($\\frac{N-1}{N}$)</td>\n      <td>1 顆硬碟</td>\n      <td>4 次 I/O (2 讀 + 2 寫)</td>\n      <td>以區塊條帶化分散資料，並將 XOR 同位碼循環分散於各碟。兼顧容量利用率與容錯。小寫入需讀取舊資料與舊同位計算新同位。</td>\n    </tr>\n    <tr>\n      <td><strong>RAID 6<br/>(Dual Parity)</strong></td>\n      <td>$(N - 2) \\times C$ ($\\frac{N-2}{N}$)</td>\n      <td>2 顆硬碟 (任意2顆)</td>\n      <td>6 次 I/O (3 讀 + 3 寫)</td>\n      <td>雙重獨立同位碼（P + Q 校驗）。可承受陣列重建（Rebuild）期間第二顆硬碟崩潰之極限情境。適用於超大容量慢速硬碟陣列。</td>\n    </tr>\n  </tbody>\n</table>\n</div>",
      "rubric": [
        "SSTF 路徑與總柱距（236）推導正確（3 分）",
        "SCAN 抵達 0 端點折返與總柱距（236）計算無誤（3 分）",
        "C-SCAN 循環路徑與柱距推導清晰（3 分）",
        "RAID 矩陣四等級空間利用率與容錯數無誤（3 分）",
        "RAID 5 (4次 I/O) 與 RAID 6 (6次 I/O) 寫入懲罰剖析透徹（2 分）"
      ],
      "scope": "final"
    },
    {
      "id": "essay22",
      "chapter": "ch7",
      "title": "讀者-寫者問題（Readers-Writers Problem）讀者優先實作與寫者飢餓改善方案",
      "category": "design",
      "tags": [
        "CH7",
        "讀者寫者",
        "Semaphore",
        "飢餓預防",
        "寫者優先"
      ],
      "question": "讀者-寫者問題（Readers-Writers Problem）是資料庫並發控制的典範。請依題意回答下列問題：\n<br/>\n1. 請寫出第一類讀者優先（Readers-Preference）架構下，讀者（Reader）與寫者（Writer）的標準號誌虛擬碼，並說明號誌 mutex 與 rw_mutex 的各自防護職責。<br/>\n2. 為什麼第一類讀者優先會造成寫者飢餓（Writer Starvation）？請說明其觸發時序鏈。<br/>\n3. 請提出一種能防止寫者飢餓的架構設計理念（第二類寫者優先或公平佇列），並以文字說明其如何協調讀者與寫者的進入順序。",
      "hint": "關鍵在於第一位進入的讀者執行 wait(rw_mutex)，最後一位離開的讀者執行 signal(rw_mutex)；若後續讀者在前者未全離開前持續加入，rw_mutex 將永遠不被釋放。",
      "answer": "<p><strong>【題解第一部分：第一類讀者優先號誌實作】</strong></p>\n<p>共享變數宣告：</p>\n<pre style=\"background: var(--bg-card); padding: 0.8rem; border-radius: 6px;\"><code>semaphore rw_mutex = 1; // 讀寫互斥鎖（寫者獨占鎖）\nsemaphore mutex = 1;    // 保護 readcount 變數的互斥鎖\nint readcount = 0;      // 記錄當前在資料庫內讀取的讀者人數</code></pre>\n<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;\">\n<div>\n<p><strong>寫者行程（Writer）：</strong></p>\n<pre style=\"background: var(--bg-card); padding: 0.8rem; border-radius: 6px;\"><code>do {\n    wait(rw_mutex); // 申請獨占存取權\n\n    /* 執行寫入 (Writing) */\n\n    signal(rw_mutex); // 釋放獨占權\n} while (true);</code></pre>\n</div>\n<div>\n<p><strong>讀者行程（Reader）：</strong></p>\n<pre style=\"background: var(--bg-card); padding: 0.8rem; border-radius: 6px;\"><code>do {\n    wait(mutex);\n    readcount++;\n    if (readcount == 1)\n        wait(rw_mutex); // 第一位讀者負責鎖住寫者\n    signal(mutex);\n\n    /* 執行讀取 (Reading) */\n\n    wait(mutex);\n    readcount--;\n    if (readcount == 0)\n        signal(rw_mutex); // 最後一位讀者負責解鎖寫者\n    signal(mutex);\n} while (true);</code></pre>\n</div>\n</div>\n\n<p><strong>【題解第二部分：寫者飢餓（Writer Starvation）成因分析】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li>當第一個讀者進入並將 <code>readcount</code> 變為 1 時，該讀者成功執行 <code>wait(rw_mutex)</code> 鎖定寫者。</li>\n  <li>此時若後續有其他讀者陸續到達，因為 <code>readcount > 1</code>，後續讀者不需要也不會呼叫 <code>wait(rw_mutex)</code>，而是直接通過檢查進入資料庫並發讀取。</li>\n  <li>若此時有一個寫者發起寫入請求，寫者在 <code>wait(rw_mutex)</code> 被迫阻塞等待。</li>\n  <li>若讀者群源源不絕到達，只要前批讀者尚未全數離開前又有新讀者補上，<code>readcount</code> 就永遠維持大於 0（不會歸零）。因此 <code>signal(rw_mutex)</code> 永遠不會被觸發！</li>\n  <li>寫者將陷入無限期的等待與飢餓（Starvation），系統的資料更新功能完全癱瘓。</li>\n</ol>\n\n<p><strong>【題解第三部分：第二類寫者優先（Writers-Preference）或公平佇列改善】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>第二類寫者優先架構：</strong>\n    <ul>\n      <li>引入額外的 <code>writecount</code> 與 <code>w_mutex</code>，以及一個控制讀者進入的號誌（如 <code>readTry</code> 或 <code>queue</code>）。</li>\n      <li>當第一個寫者提出請求時，寫者鎖定 <code>readTry</code> 號誌。</li>\n      <li>一旦寫者鎖定 <code>readTry</code>，所有後續到達的新讀者立即在 <code>readTry</code> 前排隊等待，不得再直接進入讀取。</li>\n      <li>資料庫中已經在讀取的現存讀者允許繼續讀完並離開；當現存讀者全數離開時（<code>readcount == 0</code>），等待中的寫者立即獲得資料庫執行權。</li>\n      <li><strong>效果：</strong> 保障寫者請求具備最高優先權，避免寫者無限期延宕。</li>\n    </ul>\n  </li>\n  <li><strong>公平 FCFS 佇列解法：</strong> 讀者與寫者到達時皆必須先在一個全域 FCFS 號誌或管程佇列中排號，杜絕任何一方因偏袒而陷入飢餓。</li>\n</ol>",
      "rubric": [
        "讀者與寫者標準虛擬碼、mutex 與 rw_mutex 職責正確（5 分）",
        "寫者飢餓成因（readcount 維持大於 0 導致 rw_mutex 無法釋放）邏輯清晰（4 分）",
        "防飢餓機制（寫者優先阻擋新讀者或 FCFS 佇列）說明透徹（5 分）"
      ],
      "scope": "final"
    },
    {
      "id": "essay23",
      "chapter": "ch9",
      "title": "虛擬記憶體系統顛簸（Thrashing）成因、局部性原理與工作集模型（Working-Set Model）數學推導",
      "category": "design",
      "tags": [
        "CH9",
        "Thrashing",
        "系統顛簸",
        "工作集模型",
        "Locality",
        "PFF"
      ],
      "question": "系統顛簸（Thrashing）是虛擬記憶體管理最嚴重的病理現象。請深入回答下列問題：\n<br/>\n1. 什麼是系統顛簸？請以「CPU 利用率與多道程式設計程度（Degree of Multiprogramming）」的關係曲線圖特徵，說明顛簸是如何惡性循環觸發的？<br/>\n2. 什麼是程式執行的「局部性原理（Principle of Locality）」？時間局部性與空間局部性有何不同？為什麼局部性是虛擬記憶體與快取技術能成功的核心前提？<br/>\n3. 請給出彼得·丹寧（Peter Denning）提出的「工作集模型（Working-Set Model）」的精準數學定義（包含工作集視窗 $\\Delta$、行程工作集大小 $WSS_i$ 與系統總需求量 $D$）。作業系統如何利用工作集模型或分頁錯誤頻率（PFF）精準預防顛簸？",
      "hint": "顛簸循環：頁框不足 -> 缺頁率飆升 -> CPU 等待磁碟 I/O 空閒 -> 排程器誤判而載入更多行程 -> 頁框更加短缺 -> 崩潰；D = sum(WSS_i) > m 時觸發懸掛行程。",
      "answer": "<p><strong>【題解第一部分：系統顛簸定義與惡性循環機制】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>系統顛簸定義：</strong> 當一個行程花費在分頁置換（Paging / Swapping）的時間遠遠大於其執行指令的實質時間時，該行程或系統即處於「顛簸（Thrashing）」狀態。</li>\n  <li><strong>崩潰惡性循環機制（CPU 利用率曲線）：</strong>\n    <ul>\n      <li>在正常情況下，隨著多道程式設計程度（Degree of Multiprogramming，記憶體中行程數量）提升，CPU 利用率會穩健上升。</li>\n      <li>當行程數過多，導致配置給各行程的實體頁框數低於其執行所需的最低頁面時，各行程頻繁發生分頁錯誤（Page Fault）。</li>\n      <li>發生缺頁的行程被迫進入磁碟 I/O 等待佇列；由於大量行程都在等待磁碟換頁，Ready Queue 變空，CPU 利用率<strong>呈現懸崖式暴跌（Plummet）</strong>！</li>\n      <li>作業系統的 CPU 排程器（如長期排程器）監控到 CPU 利用率過低，<strong>誤判為系統負載不足</strong>，於是主動自磁碟載入更多新行程進入記憶體！</li>\n      <li>新行程進一步爭奪本已極度匱乏的實體頁框，缺頁率更形惡化，磁碟排程佇列徹底塞死，整台電腦完全凍結，無任何有效計算產出。</li>\n    </ul>\n  </li>\n</ol>\n\n<p><strong>【題解第二部分：局部性原理（Principle of Locality）】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>時間局部性（Temporal Locality）：</strong> 某個記憶體位址一旦被存取，在不久的將來極有可能被再次存取（如迴圈變數、常用函數常式）。</li>\n  <li><strong>空間局部性（Spatial Locality）：</strong> 某個記憶體位址一旦被存取，與其相鄰或接近的位址在不久的將來極有可能被存取（如陣列循序遍歷、連續執行的指令串列）。</li>\n  <li><strong>技術成功基石：</strong> 程式在任何執行階段，實際活動存取的頁面僅佔其總程式碼大小的一小部分（稱為 Local Phase）。因此只要系統能將目前局部性所需的頁面常駐於記憶體中，缺頁率便能控制在極低水準，使虛擬記憶體展現接近實體記憶體的存取速度。</li>\n</ol>\n\n<p><strong>【題解第三部分：工作集模型（Working-Set Model）與防範策略】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>數學定義：</strong>\n    <ul>\n      <li><strong>工作集視窗（Working-Set Window, $\\Delta$）：</strong> 一個預設的固定參數，代表最近存取的 $\\Delta$ 個分頁參照。</li>\n      <li><strong>行程工作集大小（$WSS_i$）：</strong> 行程 $P_i$ 在最近 $\\Delta$ 次存取中所包含的<strong>相異頁面總數</strong>。若 $\\Delta$ 過小無法涵蓋局部性，若過大則跨越多個局部性。</li>\n      <li><strong>系統總記憶體頁框需求量（$D$）：</strong> 系統中所有活動行程工作集之總和：\n        $$D = \\sum_{i} WSS_i$$</li>\n    </ul>\n  </li>\n  <li><strong>工作集防顛簸策略：</strong> 設實體記憶體總可用頁框數為 $m$：\n    <ul>\n      <li>若 $D \\le m$：系統處於安全狀態，各行程均能獲得充足頁框，允許正常執行。</li>\n      <li>若 $D > m$：總需求超過實體容量，<strong>顛簸必然發生</strong>！作業系統必須立即挑選特定行程進行<strong>暫停掛起（Suspend / Swap-out）</strong>，釋放其所佔用的頁框分配給其他行程，直到 $D \\le m$ 為止。</li>\n    </ul>\n  </li>\n  <li><strong>分頁錯誤頻率（PFF）替代監控策略：</strong> 直接為缺頁率設定上限與下限閾值：\n    <ul>\n      <li>若缺頁率高於上限：表示配置不足，直接增發頁框；若無空閒頁框則掛起該行程。</li>\n      <li>若缺頁率低於下限：表示配置過剩，收回其多餘頁框給他人使用。</li>\n    </ul>\n  </li>\n</ol>",
      "rubric": [
        "系統顛簸定義與 CPU 利用率崩潰惡性循環解釋正確（5 分）",
        "局部性原理（時間與空間局部性）及其核心角色論述清楚（4 分）",
        "工作集模型數學定義（Delta, WSS_i, D）完整（3 分）",
        "D > m 判定與掛起行程調度及 PFF 策略說明透徹（2 分）"
      ],
      "scope": "final"
    },
    {
      "id": "essay24",
      "chapter": "ch6",
      "title": "【老師交代 100% 必考手繪圖】分段硬體架構圖（Segmentation Hardware）繪製與位址轉換推導",
      "scope": "final",
      "category": "design",
      "tags": [
        "CH6",
        "必考畫圖",
        "Segmentation",
        "硬體架構",
        "位址轉換",
        "老師交代必考"
      ],
      "question": "<strong>【期末核心大題 · 老師課堂特別點名必考】</strong>\n<br/>\n分段（Segmentation）提供符合程式設計師思維的二維位址空間。請回答下列問題：\n<br/>\n1. <strong>【必考手繪題】</strong> 請親手繪出完整的<strong>「分段硬體位址轉換架構圖（Segmentation Hardware）」</strong>，圖中必須清晰完整標註下列所有元件、訊號線與判斷路徑：\n  - CPU 邏輯位址暫存器（段號 $s$ 與位移 $d$）\n  - 段表（Segment Table）及其內部的兩大關鍵欄位名稱\n  - 比較器（Comparator）及其判斷條件與 Yes/No 分支走向\n  - 錯誤設陷（Trap: addressing error）路徑\n  - 加法器（Adder）及其兩端輸入與輸出\n  - 實體記憶體（Physical Memory）\n<br/>\n2. 說明段表中的 <code>limit</code> 與 <code>base</code> 各自代表何種實體物理意義？為什麼硬體設計上必須「先比較 limit，再相加 base」？如果顛倒順序會引發何種嚴重後果？",
      "hint": "手繪時務必記得畫出 d 與 limit 的比較器，且未通過時拉出箭頭指向 trap: addressing error！這是考試評分最容易扣分的地雷！",
      "answer": "<p><strong>【題解第一部分：分段硬體架構圖手繪結構】</strong></p>\n<div style=\"text-align: center; margin-bottom: 1rem;\">\n  <img src=\"images/OS-ch06/slide_28.png\" alt=\"Segmentation Hardware\" style=\"max-width: 100%; border-radius: 8px; border: 2px solid var(--accent-rose); box-shadow: 0 4px 16px rgba(244, 63, 94, 0.25);\"/>\n  <p style=\"font-size: 0.88rem; color: var(--accent-rose); font-weight: bold; margin-top: 0.4rem;\">【標準答案手繪架構圖 · 投影片 Slide 28】</p>\n</div>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>CPU 邏輯位址暫存器：</strong> 水平長條，左半部為段號 $s$（Segment Number），右半部為頁內位移 $d$（Offset）。</li>\n  <li><strong>段表（Segment Table）：</strong> 表格結構，包含兩欄位：\n    <ul>\n      <li><code>limit</code>：記錄該分段的合法長度（長度大小）。</li>\n      <li><code>base</code>：記錄該分段在實體記憶體中的起始實體位址。</li>\n      <li>段號 $s$ 作為索引指向段表的第 $s$ 筆條目。</li>\n    </ul>\n  </li>\n  <li><strong>比較器（Comparator <code>&lt;</code>）：</strong>\n    <ul>\n      <li>兩端輸入：位移 $d$ 與段表查出之 <code>limit</code>。</li>\n      <li>判斷條件：$d < \text{limit}$。</li>\n      <li><strong>No 分支（$d \\ge \text{limit}$）：</strong> 觸發 <strong>trap; addressing error</strong> 進入作業系統核心終止非法越界存取（考生最容易漏畫！）。</li>\n      <li><strong>Yes 分支（$d < \text{limit}$）：</strong> 存取合法，信號准許加法器運作。</li>\n    </ul>\n  </li>\n  <li><strong>硬體加法器（Adder <code>+</code>）：</strong> 圓形加法符號，將段表查出之 <code>base</code> 實體基底與位移 $d$ 相加，輸出實體位址：$$\text{Physical Address} = \text{base} + d$$</li>\n  <li><strong>實體記憶體（Physical Memory）：</strong> 接收實體位址，存取目標資料或指令。</li>\n</ol>\n\n<p><strong>【題解第二部分：Limit 與 Base 意義及順序不可顛倒原因】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>兩大欄位物理意義：</strong>\n    <ul>\n      <li><code>limit</code>：該段程式或資料的實際長度邊界，用於實施記憶體邊界保護（Protection）。</li>\n      <li><code>base</code>：該分段被載入至實體記憶體時的第一個位元組的實體起始位址，用於動態重定位（Relocation）。</li>\n    </ul>\n  </li>\n  <li><strong>為何必須「先比 limit，後加 base」？</strong>\n    <ul>\n      <li><strong>邊界防護優先性：</strong> $d$ 是段內偏移量，只有當 $d < \text{limit}$ 時，$d$ 才是合法的段內存取。若不先檢查合法性就直接相加，非法越界位址將直接流入位址匯流排。</li>\n      <li><strong>防止越界污染與溢位：</strong> 若先執行 $\text{base} + d$，惡意或錯誤的巨大 $d$ 可能導致整數加法溢位（Integer Overflow）繞回合法範圍，或者算出的位址剛好落入相鄰的其他行程或作業系統核心區段內；若此時未即時攔截，可能會引發非法的記憶體竄改或權限穿透！</li>\n      <li>因此硬體邏輯設計強制規定：<strong>必須先通過比較器確認 $d < \text{limit}$ 合法，才允許將 base 與 d 合成實體位址送往記憶體</strong>。</li>\n    </ul>\n  </li>\n</ol>",
      "rubric": [
        "完整畫出 CPU <s, d> 暫存器與段表查表指針（3 分）",
        "段表明確標註 limit 與 base 兩大欄位（2 分）",
        "比較器明確標註 d < limit 以及 No 分支之 trap: addressing error 設陷（4 分）",
        "加法器 base + d 正確輸出至 Physical Memory（3 分）",
        "說明 limit/base 意義並解釋為何先比 limit 後加 base（3 分）"
      ]
    },
    {
      "id": "essay25",
      "chapter": "ch6",
      "title": "【老師交代 100% 一定考】TLB 硬體架構手繪圖、EAT 兩階分頁推導與 ASID 防 Flush 機制綜合大題",
      "scope": "final",
      "category": "calc",
      "tags": [
        "CH6",
        "TLB",
        "EAT",
        "必考畫圖",
        "必考計算",
        "ASID",
        "兩階分頁",
        "老師交代必考"
      ],
      "question": "<strong>【期末核心大題 · 老師課堂特別點名「TLB 一定考」】</strong>\n<br/>\n分頁架構中引入 TLB（Translation Look-aside Buffer）是解決記憶體存取瓶頸的核心技術。請回答下列三小題：\n<br/>\n1. <strong>【必考手繪題】</strong> 請繪出<strong>「具備 TLB 之分頁硬體查詢流程圖（Paging Hardware with TLB）」</strong>，圖中必須清晰標註下列所有元件與訊號走向：\n  - CPU 邏輯位址暫存器（頁號 $p$ 與位移 $d$）\n  - TLB 關聯快取本體（包含 Page # 與 Frame # 欄位）\n  - TLB Hit（命中）路徑與實體位址合成\n  - TLB Miss（未命中）路徑與主記憶體頁表（Page Table）查詢\n  - <strong>查表後將新條目寫入回填更新 TLB 的回饋訊號線（關鍵扣分點）</strong>\n  - 實體記憶體（Physical Memory）\n<br/>\n2. <strong>【必考計算題】</strong> 某系統採用<strong>兩階分頁（Two-level Paging）</strong>架構，主記憶體存取時間為 $t_{\\text{mem}} = 100\\,\\text{ns}$，TLB 查詢時間為 $t_{\\text{TLB}} = 20\\,\\text{ns}$：\n  - (a) 當發生 <strong>TLB Hit</strong> 時，CPU 存取一次記憶體所需的完整耗時為多少？\n  - (b) 當發生 <strong>TLB Miss</strong> 時，CPU 總共需存取幾次主記憶體？計算單次 TLB Miss 的完整存取耗時。\n  - (c) 若該系統要求有效記憶體存取時間（EAT）不得超過 $140\\,\\text{ns}$，請寫出數學方程式並嚴密推導出該系統硬體 TLB 的最低命中率 $\\alpha$ 必須達到多少？\n<br/>\n3. <strong>【必考觀念題】</strong> 傳統作業系統在每次進行行程上下文切換（Context Switch）時，為什麼必須全面清空（Flush）TLB？現代處理器如何<strong>透過 ASID（Address-Space Identifier）</strong>徹底消除 Flush TLB 的高昂開銷？說明其比對機制與效益。",
      "hint": "注意：兩階分頁在 TLB Miss 時需存取 3 次主記憶體（外層頁表 + 內層頁表 + 資料）；手繪時回填更新 TLB 的箭頭未畫會被扣分！",
      "answer": "<p><strong>【題解第一部分：具備 TLB 之分頁硬體架構手繪結構】</strong></p>\n<div style=\"text-align: center; margin-bottom: 1rem;\">\n  <img src=\"images/OS-ch06/slide_42.png\" alt=\"Paging Hardware With TLB\" style=\"max-width: 100%; border-radius: 8px; border: 2px solid var(--accent-rose); box-shadow: 0 4px 16px rgba(244, 63, 94, 0.25);\"/>\n  <p style=\"font-size: 0.88rem; color: var(--accent-rose); font-weight: bold; margin-top: 0.4rem;\">【標準答案手繪架構圖 · 投影片 Slide 42】</p>\n</div>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>CPU 邏輯暫存器：</strong> 水平長方形，劃分為頁號 $p$（高位元）與頁內位移 $d$（低位元）。</li>\n  <li><strong>TLB 關聯快取方塊：</strong> 標明內部包含 <code>Page #</code> 與 <code>Frame #</code> 欄位，$p$ 輸入並行電路搜尋。</li>\n  <li><strong>TLB Hit 分支：</strong> 直接輸出頁框號 $f$，與 $d$ 拼接合成實體位址 $f | d$，送往實體記憶體讀取（僅 1 次記憶體存取）。</li>\n  <li><strong>TLB Miss 分支：</strong>\n    <ul>\n      <li>未命中訊號導向主記憶體中的<strong>頁表（Page Table）</strong>，以 $p$ 查表取得 $f$。</li>\n      <li><strong>關鍵回填線（Miss Update）：</strong> 必須畫出一條箭頭線，將新查詢到的映射條目 <code>&lt;p, f&gt;</code> <strong>寫回更新至 TLB 快取中</strong>！</li>\n      <li>取得 $f$ 後拼接 $d$ 存取實體記憶體資料。</li>\n    </ul>\n  </li>\n  <li><strong>實體記憶體（Physical Memory）：</strong> 接收實體位址執行最終資料讀寫。</li>\n</ol>\n\n<p><strong>【題解第二部分：兩階分頁 EAT 數學計算與推導】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>(a) TLB Hit 耗時：</strong>\n    $$\text{Hit Time} = t_{\\text{TLB}} + t_{\\text{mem}} = 20 + 100 = \\mathbf{120\\,\\text{ns}}$$\n  </li>\n  <li><strong>(b) TLB Miss 記憶體存取次數與耗時：</strong>\n    <ul>\n      <li>第 1 次記憶體存取：根據外層頁號 $p_1$ 存取外層頁表。</li>\n      <li>第 2 次記憶體存取：根據內層頁號 $p_2$ 存取內層頁表取得頁框號 $f$。</li>\n      <li>第 3 次記憶體存取：根據實體位址 $f | d$ 存取真實資料。</li>\n      <li><strong>總共存取 3 次主記憶體</strong>。</li>\n      <li>$$\\text{Miss Time} = t_{\\text{TLB}} + 3 \\times t_{\\text{mem}} = 20 + 3 \\times 100 = 20 + 300 = \\mathbf{320\\,\\text{ns}}$$</li>\n    </ul>\n  </li>\n  <li><strong>(c) 求解最低命中率 $\\alpha$：</strong>\n    有效存取時間方程式為：\n    $$\\text{EAT} = \\alpha \\times \\text{Hit Time} + (1 - \\alpha) \\times \\text{Miss Time}$$\n    $$\\text{EAT} = \\alpha \\times 120 + (1 - \\alpha) \\times 320 = 320 - 200\\alpha$$\n    依題意要求 $\\text{EAT} \\le 140\\,\\text{ns}$：\n    $$320 - 200\\alpha \\le 140 \\implies 200\\alpha \\ge 180 \\implies \\alpha \\ge \\frac{180}{200} = 0.90$$\n    <strong>結論：</strong> 該系統硬體 TLB 的最低命中率必須達到 <strong>90%</strong>（$\\alpha \\ge 90\\%$）。\n  </li>\n</ol>\n\n<p><strong>【題解第三部分：ASID 防止 TLB Flush 之微觀機制】</strong></p>\n<ol style=\"margin-left: 1.5rem; line-height: 1.8;\">\n  <li><strong>傳統架構必須 Flush 的原因：</strong> 各個使用者行程的邏輯位址空間相互獨立，不同行程可能使用完全相同的邏輯頁號（如行程 A 與行程 B 都有 Page 0，但映射至不同實體頁框）。若上下文切換時不清空 TLB，新行程可能會錯誤命中上一行程殘留的 TLB 條目，造成非法的記憶體存取與資料污染。因此傳統 TLB 必須在切換時全面 Flush，代價為切換初期 TLB Miss 飆高。</li>\n  <li><strong>ASID 機制：</strong> 現代 CPU 在每個 TLB 條目中增加 <strong>ASID（Address-Space Identifier，行程位址空間識別碼）</strong> 欄位。</li>\n  <li><strong>硬體比對邏輯：</strong> CPU 查詢 TLB 時，硬體電路並行比對兩個條件：\n    <br/>(1) 頁號是否相符？（<code>entry.Page == p</code>）\n    <br/>(2) 條目的 ASID 是否等於當前執行行程的 ASID？（<code>entry.ASID == current_process.ASID</code>）\n    <br/>唯有兩者同時成立才判定為 TLB Hit。</li>\n  <li><strong>工程效益：</strong> 上下文切換時<strong>完全不需要 Flush TLB</strong>，多個行程的活躍快取條目能長期共存於 TLB 中，大幅降低系統調度切換的延遲與效能損耗。</li>\n</ol>",
      "rubric": [
        "完整畫出 CPU <p, d>、TLB、Page Table、Memory 及回填寫入 TLB 箭頭（5 分）",
        "兩階分頁 TLB Hit (120 ns) 與 TLB Miss 需 3 次存取 (320 ns) 計算正確（4 分）",
        "列出 EAT 方程式並嚴密解出最低命中率 90%（3 分）",
        "說明為何傳統需 Flush 以及 ASID 雙重比對免 Flush 之機制（3 分）"
      ]
    }
  ],
  "flashcards": [
    {
      "id": "fc30",
      "chapter": "ch6",
      "front": "臨界區間問題（Critical-Section Problem）的三大數學準則為何？",
      "back": "1. **互斥（Mutual Exclusion）：** 若一進程在臨界區執行，其他進程皆不可在臨界區執行。\n2. **進展（Progress）：** 若無人處於臨界區且有人想進，僅剩餘區外進程可參與決策，不可無限延遲。\n3. **有限等待（Bounded Waiting）：** 進程發起請求到准許進入之間，其他人獲准進入次數必有上限，杜絕飢餓。",
      "scope": "final"
    },
    {
      "id": "fc31",
      "chapter": "ch6",
      "front": "自旋鎖（Spinlock）的機制是什麼？最適合應用於何種系統環境？",
      "back": "進程在等待鎖時持續執行迴圈檢查（Busy Waiting）。\n最適用於**多核心多處理器（SMP）系統中臨界區極為短暫的情境**，因為它避免了耗時的進程上下文切換（Context Switch）開銷。",
      "scope": "final"
    },
    {
      "id": "fc32",
      "chapter": "ch6",
      "front": "在計數號誌（Counting Semaphore）無忙碌等待實作中，當號誌值 S 為負數時，其絕對值 |S| 代表何種物理意義？",
      "back": "精確代表**當前正在該號誌等待佇列中被阻塞（Blocked / Sleep）睡眠的行程總數**。",
      "scope": "final"
    },
    {
      "id": "fc33",
      "chapter": "ch6",
      "front": "管程（Monitor）相較於號誌（Semaphore）的最大優勢為何？",
      "back": "管程是高階語言結構，**編譯器自動保證互斥**（任何時刻最多僅允許一個行程在管程內活動），根本杜絕因程式設計師寫錯 PV 順序而導致的致命死結。",
      "scope": "final"
    },
    {
      "id": "fc34",
      "chapter": "ch7",
      "front": "優先權反轉（Priority Inversion）是什麼？作業系統如何根治此問題？",
      "back": "高優先權 H 因等待低優先權 L 持有的鎖，而 L 反被中優先權 M 搶占 CPU，導致 H 間接被 M 延遲的異常現象。\n根治機制：**優先權繼承協定（Priority Inheritance Protocol）**，將持有鎖的 L 優先權暫時提升至 H 等級，直到 L 釋放鎖。",
      "scope": "final"
    },
    {
      "id": "fc35",
      "chapter": "ch8",
      "front": "內部碎裂（Internal Fragmentation）與外部碎裂（External Fragmentation）的本質差異為何？",
      "back": "- **外部碎裂：** 記憶體剩餘空間總和足夠，但因零碎分散無法配置給新行程（連續配置典型問題）。\n- **內部碎裂：** 分配給行程的固定區塊略大於其實際需求，區塊內部浪費的空間（分頁架構最後一頁典型問題）。",
      "scope": "final"
    },
    {
      "id": "fc36",
      "chapter": "ch8",
      "front": "分頁架構（Paging）中，TLB 的功能與有效存取時間（EAT）標準計算公式為何？",
      "back": "TLB 為高速關聯快取，快取頁號至頁框號映射。\n標準公式：$$\\text{EAT} = \\alpha \\times (t_{\\text{TLB}} + t_{\\text{mem}}) + (1 - \\alpha) \\times (t_{\\text{TLB}} + 2 \\times t_{\\text{mem}})$$\n（其中 $\\alpha$ 為命中率，$t_{\\text{TLB}}$ 為查詢時間，$t_{\\text{mem}}$ 為記憶體時間）。",
      "scope": "final"
    },
    {
      "id": "fc37",
      "chapter": "ch8",
      "front": "反向頁表（Inverted Page Table）的核心優點與致命缺點為何？",
      "back": "- **優點：** 頁表條目數等於實體頁框數，大幅縮減龐大虛擬位址空間所佔用的記憶體。\n- **缺點：** 位址搜尋慢（需遍歷或靠雜湊），且**難以天然支援多行程共享記憶體（Shared Memory）**。",
      "scope": "final"
    },
    {
      "id": "fc38",
      "chapter": "ch9",
      "front": "什麼是寫入時複製（Copy-on-Write, COW）？其最大效益為何？",
      "back": "fork() 時父子行程共用相同的唯讀實體頁面，直到任一方發起寫入修改時，作業系統才複製該頁面專屬複本。\n效益：**極大加速行程建立速度並節省大量實體記憶體空間**。",
      "scope": "final"
    },
    {
      "id": "fc39",
      "chapter": "ch9",
      "front": "什麼是貝拉迪異常（Belady's Anomaly）？哪一類演算法在數學上保證絕不發生此異常？",
      "back": "在 FIFO 演算法中，**分配更多實體頁框反而導致分頁錯誤次數增加**的反常現象。\n保證不發生：**堆疊演算法（Stack Algorithms，如 LRU、Optimal）**，因其滿足子集包含性質：$B(t, n) \\subseteq B(t, n+1)$。",
      "scope": "final"
    },
    {
      "id": "fc40",
      "chapter": "ch9",
      "front": "系統顛簸（Thrashing）發生的根本原因為何？作業系統如何監控與解決？",
      "back": "原因：多道程度過高，進程分配頁框小於工作集需求，系統時間全消耗於分頁換入換出，CPU 利用率暴跌。\n解法：利用**工作集模型（Working-Set Model）**或**分頁錯誤頻率（PFF）**監控，並透過中期排程器掛起（Swap-out）部分進程。",
      "scope": "final"
    },
    {
      "id": "fc41",
      "chapter": "ch10",
      "front": "磁碟排程中 SCAN（電梯演算法）與 C-SCAN（循環電梯）的關鍵差異為何？",
      "back": "- **SCAN：** 磁頭掃描至極端邊界後折返反向服務。\n- **C-SCAN：** 磁頭掃描至極端邊界後立即高速重返另一端起始點再同向掃描，**提供比 SCAN 更均勻一致的等待時間分佈**。",
      "scope": "final"
    },
    {
      "id": "fc42",
      "chapter": "ch10",
      "front": "固態硬碟（SSD）的「損耗平均（Wear Leveling）」與 TRIM 指令分別有何功能？",
      "back": "- **損耗平均：** 動態與靜態平均分攤抹除次數至所有快閃區塊，防止局部區塊提前損壞。\n- **TRIM 指令：** 系統通知 SSD 檔案已刪除，使 SSD 可以在背景垃圾回收時預先抹除該無效區塊提升後續寫入效能。",
      "scope": "final"
    },
    {
      "id": "fc43",
      "chapter": "ch10",
      "front": "RAID 5 磁碟陣列的空間利用率公式與容錯極限為何？",
      "back": "- **空間利用率：** $(N - 1) / N$（其中 $N$ 為硬碟總數，單顆硬碟容量等價於校驗碼佔用）。\n- **容錯極限：** 最多允許**任意 1 顆硬碟損壞**資料不流失。",
      "scope": "final"
    },
    {
      "id": "fc44",
      "chapter": "ch10",
      "front": "Unix inode 檔案索引架構由哪些類型的指標組成？",
      "back": "混合索引結構：\n1. **直接指標（Direct Blocks，通常 12 個）**：高速存取小型檔案。\n2. **單層間接指標（Single Indirect）**\n3. **雙層間接指標（Double Indirect）**\n4. **三層間接指標（Triple Indirect）**：擴展支援海量超大型檔案。",
      "scope": "final"
    },
    {
      "id": "fc45",
      "chapter": "ch6",
      "scope": "final",
      "front": "🔥【老師交代 100% 一定會考怎麼畫】手繪「分段硬體架構圖（Segmentation Hardware）」有哪五大核心元件與手繪口訣？",
      "back": "【五大核心手繪元件】：\n1. **CPU 邏輯暫存器 `<s, d>`**（s 段號，d 位移）\n2. **段表（Segment Table）**：含 **`limit`**（段長）與 **`base`**（實體基底）\n3. **比較器 `<`**：檢查 **`d < limit`**，若 No 必拉出箭頭指向 **`trap: addressing error`**（漏畫必扣分！）\n4. **加法器 `+`**：合法時計算 **`base + d`**\n5. **實體記憶體（Physical Memory）**\n\n【滿分手繪口訣】：\n「**s 查段表取 limit 與 base ➔ d 與 limit 先比大小防越界 ➔ 越界 trap 設陷 ➔ 合法 base 加 d 進記憶體**」"
    },
    {
      "id": "fc46",
      "chapter": "ch6",
      "scope": "final",
      "front": "🔥【老師交代 100% 一定考】手繪「具備 TLB 之分頁硬體架構圖」有哪五大核心元件與兩階分頁 EAT 記憶體存取次數？",
      "back": "【五大核心手繪元件】：\n1. **CPU 邏輯暫存器 `<p, d>`**（p 頁號，d 位移）\n2. **TLB 關聯快取**：含 `Page #` 與 `Frame #`，並行搜尋\n3. **TLB Hit 分支**：直接得 `f` 拼接 `d` 存取記憶體（僅 **1 次** 記憶體存取）\n4. **TLB Miss 分支**：查主記憶體頁表得 `f`，**必畫箭頭回填寫入更新 TLB**（需 **2 次** 存取，**兩階分頁則需 3 次存取**）\n5. **實體記憶體（Physical Memory）**\n\n【兩階分頁 Miss 存取 3 次記憶體推導】：\n外層頁表 (1 次) ➔ 內層頁表 (2 次) ➔ 資料讀取 (3 次)！\n$\\text{Miss Time} = t_{\\text{TLB}} + 3 \\times t_{\\text{mem}}$。"
    }
  ]
};
