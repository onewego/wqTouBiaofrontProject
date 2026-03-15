<template>
  <div class="tender-container">
    <!-- 头部区域 -->
    <header class="header">
      <h1>招投标信息平台</h1>
      <div class="header-info">
        <span>数据更新时间: {{ updateTime }}</span>
        <span>当前显示 {{ tenderData.length }} 条招标信息</span>
        <span v-if="currentQuery.title">标题搜索: {{ currentQuery.title }}</span>
        <span v-if="currentQuery.position">位置搜索: {{ currentQuery.position }}</span>
        <span v-if="currentQuery.code">分类编码: {{ currentQuery.code }}</span>
      </div>
    </header>

    <!-- 查询功能区 -->
    <div class="query-section">
      <div class="query-form">
        <!-- 模糊查询（标题/位置/分类编码） -->
        <div class="query-group">
          <label>查询:</label>
          <div class="fuzzy-query-controls">
            <div class="fuzzy-input-group">
              <input 
                v-model="titleQuery" 
                placeholder="输入标题关键词" 
                class="input-medium"
                @keyup.enter="searchByFuzzy"
              />
              <span class="input-label">标题</span>
            </div>
            <div class="fuzzy-input-group">
              <input 
                v-model="positionQuery" 
                placeholder="输入地区关键词" 
                class="input-medium"
                @keyup.enter="searchByFuzzy"
              />
              <span class="input-label">位置</span>
            </div>
            <div class="fuzzy-input-group">
              <input 
                v-model="codeQuery" 
                placeholder="输入分类编码 (2/4/6位或更多)" 
                class="input-medium"
                @keyup.enter="searchByFuzzy"
              />
              <span class="input-label">分类编码</span>
            </div>
            <button @click="searchByFuzzy" :disabled="loading.fuzzy" class="btn-info">
              {{ loading.fuzzy ? '查询中...' : '查询' }}
            </button>
            <button @click="clearFuzzyQuery" class="btn-clear">清空</button>
          </div>
        </div>

        <!-- 重置视图按钮 -->
        <div class="query-group">
          <button @click="resetView" class="btn-reset">重置视图</button>
        </div>
      </div>

      <!-- 查询状态显示 -->
      <div v-if="searchActive" class="search-status">
        <span class="search-active">搜索已激活</span>
        <span v-if="currentQuery.title">标题: "{{ currentQuery.title }}"</span>
        <span v-if="currentQuery.position">位置: "{{ currentQuery.position }}"</span>
        <span v-if="currentQuery.code">分类编码: "{{ currentQuery.code }}"</span>
        <button @click="clearSearch" class="btn-clear-small">清除搜索</button>
      </div>
    </div>

    <!-- 数据展示区 -->
    <div class="data-section">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>数据加载中...</p>
      </div>

      <!-- 搜索结果统计 -->
      <div v-if="searchActive && tenderData.length > 0" class="search-results">
        <h3>
          <span class="search-icon">🔍</span>
          找到 {{ totalCount }} 条匹配结果
          <span v-if="searchQuerySummary" class="query-summary">{{ searchQuerySummary }}</span>
        </h3>
      </div>

      <!-- 招标信息列表 -->
      <div v-if="tenderData.length > 0" class="tender-list">
        <div 
          v-for="item in tenderData" 
          :key="item.id" 
          class="tender-card"
          @click="toggleCardExpansion(item.id)"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="card-title">
              <h3>
                <span v-if="highlightText(item.proname, titleQuery)" v-html="highlightText(item.proname, titleQuery)"></span>
                <span v-else>{{ item.proname || '未命名项目' }}</span>
              </h3>
              <div class="card-subtitle">
                <span class="card-id">ID: {{ item.id }}</span>
                <!-- 分类标签区域 - 从categoryList获取 -->
                <div class="category-tags" v-if="item.categoryList && item.categoryList.length">
                  <template v-for="(cat, idx) in validCategories(item.categoryList)" :key="idx">
                    <span 
                      class="category-tag"
                      :title="getCategoryDisplay(cat)"
                    >
                      {{ getCategoryDisplay(cat) }}
                    </span>
                  </template>
                  <!-- 如果没有有效的分类，显示暂无分类 -->
                  <span v-if="validCategories(item.categoryList).length === 0" class="category-tag no-category">
                    暂无分类
                  </span>
                </div>
                <span v-else class="category-tag no-category">暂无分类</span>
              </div>
            </div>
            <div class="card-status">
              <span class="status-badge" :class="getStatusClass(item)">
                {{ getStatusText(item) }}
              </span>
              <span class="budget">预算: {{ formatCurrency(item.budgetAmount) }}</span>
            </div>
          </div>

          <!-- 卡片主体 -->
          <div class="card-body">
            <!-- 基本信息行 -->
            <div class="info-row">
              <div class="info-item">
                <span class="label">项目编号:</span>
                <span class="value">{{ item.prono || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">招标方式:</span>
                <span class="value">{{ item.tenderMethod || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">地区:</span>
                <span class="value">
                  <span v-if="highlightText(item.area, positionQuery)" v-html="highlightText(item.area, positionQuery)"></span>
                  <span v-else>{{ item.area || 'N/A' }}</span>
                </span>
              </div>
            </div>

            <!-- 时间信息行 -->
            <div class="info-row">
              <div class="info-item">
                <span class="label">发布时间:</span>
                <span class="value">{{ item.publishTime || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">投标截止:</span>
                <span class="value">{{ item.biddingDeadline || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">开标时间:</span>
                <span class="value">{{ item.kaibiaodate || 'N/A' }}</span>
              </div>
            </div>

            <!-- 联系信息行 -->
            <div class="info-row">
              <div class="info-item">
                <span class="label">采购人:</span>
                <span class="value">{{ item.purchaser || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">代理机构:</span>
                <span class="value">{{ item.agentCompany || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">分类编码:</span>
                <span class="value">
                  <!-- 详情页显示所有分类 -->
                  <template v-if="item.categoryList && item.categoryList.length">
                    <div v-for="(cat, idx) in validCategories(item.categoryList)" :key="idx" class="detail-category-item">
                      {{ getCategoryDisplay(cat) }}
                    </div>
                    <span v-if="validCategories(item.categoryList).length === 0">N/A</span>
                  </template>
                  <span v-else>N/A</span>
                </span>
              </div>
            </div>

            <!-- 详情区域（展开时显示） -->
            <div v-if="expandedCardId === item.id" class="card-details">
              <!-- 基本详情 -->
              <div class="details-section">
                <h4>基础信息</h4>
                <div class="details-grid">
                  <div class="detail-item">
                    <span class="detail-label">信息ID:</span>
                    <span class="detail-value">{{ item.infoid || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">信息来源:</span>
                    <a v-if="item.infoUrl" :href="item.infoUrl" target="_blank" class="detail-link">
                      查看原文
                    </a>
                    <span v-else class="detail-value">N/A</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">文件获取时间:</span>
                    <span class="detail-value">{{ item.docStartTime || 'N/A' }} 至 {{ item.docEndTime || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <!-- 分类详情（新增） -->
              <div class="details-section" v-if="item.categoryList && item.categoryList.length">
                <h4>分类信息</h4>
                <div class="category-details">
                  <div v-for="(cat, idx) in item.categoryList" :key="idx" class="category-detail-item" :class="{ 'not-classified': cat.isClassifyed === '0' }">
                    <div class="category-header">
                      <span class="category-badge" v-if="cat.isClassifyed === '1'">已分类</span>
                      <span class="category-badge not-classified" v-else>未分类</span>
                      <span class="category-time">{{ formatDate(cat.createdTime) }}</span>
                    </div>
                    <div class="category-levels">
                      <div v-if="cat.codeLevel1 && cat.nameLevel1" class="category-level">
                        <span class="level-code">{{ cat.codeLevel1 }}</span>
                        <span class="level-name">{{ cat.nameLevel1 }}</span>
                      </div>
                      <div v-if="cat.codeLevel2 && cat.nameLevel2" class="category-level">
                        <span class="level-arrow">→</span>
                        <span class="level-code">{{ cat.codeLevel2 }}</span>
                        <span class="level-name">{{ cat.nameLevel2 }}</span>
                      </div>
                      <div v-if="cat.codeLevel3 && cat.nameLevel3" class="category-level">
                        <span class="level-arrow">→</span>
                        <span class="level-code">{{ cat.codeLevel3 }}</span>
                        <span class="level-name">{{ cat.nameLevel3 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 联系详情 -->
              <div class="details-section">
                <h4>联系方式</h4>
                <div class="details-grid">
                  <div class="detail-item">
                    <span class="detail-label">采购人地址:</span>
                    <span class="detail-value">{{ item.purchaserAddress || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">采购人电话:</span>
                    <span class="detail-value">{{ item.purchaserPhone || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">代理机构地址:</span>
                    <span class="detail-value">{{ item.agentAddress || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">代理机构电话:</span>
                    <span class="detail-value">{{ item.agentPhone || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <!-- 项目详情 -->
              <div class="details-section" v-if="item.sectionProjectNeed || item.sectionProjectOverview">
                <h4>项目详情</h4>
                <div class="detail-content">
                  <p v-if="item.sectionProjectNeed"><strong>项目需求:</strong> {{ item.sectionProjectNeed }}</p>
                  <p v-if="item.sectionProjectOverview"><strong>项目概述:</strong> {{ item.sectionProjectOverview }}</p>
                  <p v-if="item.sectionBasicInfo"><strong>基本信息:</strong> {{ item.sectionBasicInfo }}</p>
                  <p v-if="item.sectionQualification"><strong>资质要求:</strong> {{ item.sectionQualification }}</p>
                  <p v-if="item.sectionDocAcquisition"><strong>文件获取:</strong> {{ item.sectionDocAcquisition }}</p>
                </div>
              </div>

              <!-- 系统信息 -->
              <div class="details-section">
                <h4>系统信息</h4>
                <div class="details-grid">
                  <div class="detail-item">
                    <span class="detail-label">解析状态:</span>
                    <span class="detail-value">{{ getParseStatusText(item.parseStatus) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">解析时间:</span>
                    <span class="detail-value">{{ item.parseTime || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">创建时间:</span>
                    <span class="detail-value">{{ item.createdTime || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <span class="footer-text">
              点击{{ expandedCardId === item.id ? '收起' : '展开' }}详细信息
            </span>
            <div class="footer-actions">
              <button @click.stop="copyToClipboard(item.prono)" class="btn-action" v-if="item.prono">
                复制项目编号
              </button>
              <button @click.stop="viewOriginal(item.infoUrl)" class="btn-action" v-if="item.infoUrl">
                查看原文
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <span v-if="searchActive">🔍</span>
          <span v-else>📄</span>
        </div>
        <h3 v-if="searchActive">未找到匹配的招标信息</h3>
        <h3 v-else>暂无招标数据</h3>
        <p v-if="searchActive">请尝试使用其他关键词搜索</p>
        <p v-else>请使用上方查询功能获取数据</p>
        <button v-if="searchActive" @click="clearSearch" class="btn-primary">清除搜索条件</button>
      </div>

      <!-- 分页导航 -->
      <div v-if="showPagination && totalCount > pagination.pageSize" class="pagination">
        <div class="pagination-btns">
          <button 
            @click="prevPage" 
            :disabled="pagination.pageNum <= 1"
            class="pagination-btn"
          >
            上一页
          </button>
          
          <div class="page-info">
            第 {{ pagination.pageNum }} 页 / 共 {{ Math.ceil(totalCount / pagination.pageSize) }} 页
            (共 {{ totalCount }} 条)
          </div>
          
          <button 
            @click="nextPage" 
            :disabled="pagination.pageNum * pagination.pageSize >= totalCount"
            class="pagination-btn"
          >
            下一页
          </button>
        </div>
        <!-- 分页控制 -->
        <div class="query-group">
          <div class="pagination-controls">
            <input 
              v-model.number="pagination.pageNum" 
              type="number" 
              min="1" 
              placeholder="页码"
              class="input-small"
            />
            <span>每页</span>
            <select v-model="pagination.pageSize" class="select-small">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>条</span>
            <button @click="loadPageData" :disabled="loading.page" class="btn-primary">
              {{ loading.page ? '加载中...' : '查询' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { requestClient } from '#/api/request';
import { message } from 'ant-design-vue';

// 分类项类型定义
interface CategoryItem {
  id: number;
  projectId: string;
  codeLevel1: string;
  nameLevel1: string;
  codeLevel2?: string;
  nameLevel2?: string;
  codeLevel3?: string;
  nameLevel3?: string;
  isClassifyed: string;
  createdTime: string;
  updatedTime: string;
}

// 类型定义
interface TenderData {
  id: number;
  infoid: string;
  infoUrl: string;
  prono: string;
  proname: string;
  budgetAmount: number;
  tenderMethod: string;
  area: string;
  publishTime: string;
  docStartTime: string;
  docEndTime: string;
  biddingDeadline: string;
  kaibiaodate: string;
  changdi: string;
  purchaser: string;
  purchaserAddress: string;
  purchaserPhone: string;
  agentCompany: string;
  agentAddress: string;
  agentPhone: string;
  projectContact: string;
  projectPhone: string;
  sectionProjectNeed: string;
  sectionProjectOverview: string;
  sectionBasicInfo: string;
  sectionQualification: string;
  sectionDocAcquisition: string;
  sectionBiddingSchedule: string;
  sectionAnnouncementPeriod: string;
  sectionOtherMatters: string;
  sectionContact: string;
  parseStatus: number;
  parseTime: string;
  parseRetryCount: number;
  parseErrorMsg: string | null;
  isAiClassified: number;
  aiClassifyTime: string | null;
  createdTime: string;
  updatedTime: string;
  // 分类列表字段
  categoryList?: CategoryItem[];
  // 保留原字段兼容
  code?: string;
  categoryCode?: string;
}

// 状态管理
const pagination = ref({
  pageNum: 1,
  pageSize: 10
});

// 查询参数
const titleQuery = ref('');
const positionQuery = ref('');
const codeQuery = ref('');
const tenderData = ref<TenderData[]>([]);
const totalCount = ref(0);
const expandedCardId = ref<number | null>(null);

// 当前查询条件
const currentQuery = ref({
  title: '',
  position: '',
  code: ''
});

// 加载状态
const loading = ref({
  page: false,
  fuzzy: false
});

const showPagination = ref(true);
const searchActive = ref(false);

// 计算属性
const updateTime = computed(() => {
  return new Date().toLocaleString('zh-CN');
});

const isLoading = computed(() => {
  return loading.value.page || loading.value.fuzzy;
});

const searchQuerySummary = computed(() => {
  const parts = [];
  if (currentQuery.value.title) parts.push(`标题: "${currentQuery.value.title}"`);
  if (currentQuery.value.position) parts.push(`位置: "${currentQuery.value.position}"`);
  if (currentQuery.value.code) parts.push(`分类编码: "${currentQuery.value.code}"`);
  return parts.join('，');
});

// 页面加载时获取第一页数据
onMounted(() => {
  console.log('页面加载，开始获取数据...');
  loadPageData();
});

// 高亮显示搜索关键词
const highlightText = (text: string, keyword: string) => {
  if (!text || !keyword || keyword.trim() === '') return null;
  
  const keywordLower = keyword.toLowerCase();
  const textLower = text.toLowerCase();
  
  if (textLower.includes(keywordLower)) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }
  
  return null;
};

// 获取分类的最高层级代码和名称组合
const getHighestLevelCategory = (cat: CategoryItem): { code: string; name: string } | null => {
  // 如果 isClassifyed 为 '0'，表示未分类，返回 null
  if (cat.isClassifyed === '0') return null;
  
  // 从最高层级往下找，优先返回有数据的最深层级
  if (cat.codeLevel3 && cat.nameLevel3 && cat.codeLevel3.trim() !== '' && cat.nameLevel3.trim() !== '') {
    return { code: cat.codeLevel3, name: cat.nameLevel3 };
  }
  if (cat.codeLevel2 && cat.nameLevel2 && cat.codeLevel2.trim() !== '' && cat.nameLevel2.trim() !== '') {
    return { code: cat.codeLevel2, name: cat.nameLevel2 };
  }
  if (cat.codeLevel1 && cat.nameLevel1 && cat.codeLevel1.trim() !== '' && cat.nameLevel1.trim() !== '') {
    return { code: cat.codeLevel1, name: cat.nameLevel1 };
  }
  return null;
};

// 获取分类显示文本（代码 + 名称）
const getCategoryDisplay = (cat: CategoryItem): string => {
  const highest = getHighestLevelCategory(cat);
  if (highest) {
    return `${highest.code} ${highest.name}`;
  }
  return '未分类';
};

// 过滤出有效的分类（已分类且有数据的）
const validCategories = (categoryList: CategoryItem[]): CategoryItem[] => {
  return categoryList.filter(cat => getHighestLevelCategory(cat) !== null);
};

// 格式化日期
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

// 校验分类编码输入格式（2、4、6位或更多位）
const isValidCodeQuery = (code: string): boolean => {
  if (!code) return true;
  const len = code.length;
  return len === 2 || len === 4 || len === 6 || len >= 7;
};

// 模糊搜索
const searchByFuzzy = async () => {
  if (codeQuery.value && !isValidCodeQuery(codeQuery.value)) {
    message.warning('分类编码必须为2位、4位、6位或更多位');
    return;
  }

  if (!titleQuery.value && !positionQuery.value && !codeQuery.value) {
    message.warning('请输入标题、位置或分类编码关键词');
    return;
  }
  
  loading.value.fuzzy = true;
  showPagination.value = true;
  searchActive.value = true;
  
  currentQuery.value = {
    title: titleQuery.value.trim(),
    position: positionQuery.value.trim(),
    code: codeQuery.value.trim()
  };
  
  pagination.value.pageNum = 1;
  
  try {
    console.log('开始模糊搜索:', currentQuery.value);
    
    const params: any = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    };
    
    if (currentQuery.value.title) params.title = currentQuery.value.title;
    if (currentQuery.value.position) params.position = currentQuery.value.position;
    if (currentQuery.value.code) params.code = currentQuery.value.code;
    
    const response = await requestClient.get('/api/tender-parsed/page', { params });
    
    let data: TenderData[] = [];
    let count = 0;
    
    // 处理标准分页响应格式
    if (response && response.data) {
      if (response.data.records) {
        data = response.data.records;
        count = response.data.total || response.data.records.length;
      } else if (Array.isArray(response.data)) {
        data = response.data;
        count = response.data.length;
      } else {
        data = response.data;
        count = response.total || (Array.isArray(response.data) ? response.data.length : 0);
      }
    } else if (Array.isArray(response)) {
      data = response;
      count = response.length;
    } else if (response && response.records) {
      data = response.records;
      count = response.total || response.records.length;
    }
    
    tenderData.value = data || [];
    totalCount.value = count || 0;
    
    if (tenderData.value.length > 0) {
      message.success(`找到 ${totalCount.value} 条匹配结果`);
    } else {
      message.info('未找到匹配的招标信息');
    }
  } catch (error: any) {
    console.error('模糊搜索失败:', error);
    tenderData.value = [];
    totalCount.value = 0;
    message.error(`搜索失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value.fuzzy = false;
  }
};

// 清除模糊查询输入
const clearFuzzyQuery = () => {
  titleQuery.value = '';
  positionQuery.value = '';
  codeQuery.value = '';
};

// 清除搜索状态
const clearSearch = () => {
  clearFuzzyQuery();
  currentQuery.value = { title: '', position: '', code: '' };
  searchActive.value = false;
  loadPageData();
  message.info('已清除搜索条件');
};

// 加载分页数据
const loadPageData = async () => {
  loading.value.page = true;
  showPagination.value = true;
  
  try {
    const params: any = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    };
    
    if (searchActive.value && (currentQuery.value.title || currentQuery.value.position || currentQuery.value.code)) {
      if (currentQuery.value.title) params.title = currentQuery.value.title;
      if (currentQuery.value.position) params.position = currentQuery.value.position;
      if (currentQuery.value.code) params.code = currentQuery.value.code;
    }
    
    const response = await requestClient.get('/api/tender-parsed/page', { params });
    
    let data: TenderData[] = [];
    let count = 0;
    
    // 处理标准分页响应格式
    if (response && response.data) {
      if (response.data.records) {
        data = response.data.records;
        count = response.data.total || response.data.records.length;
      } else if (Array.isArray(response.data)) {
        data = response.data;
        count = response.data.length;
      } else {
        data = response.data;
        count = response.total || (Array.isArray(response.data) ? response.data.length : 0);
      }
    } else if (Array.isArray(response)) {
      data = response;
      count = response.length;
    } else if (response && response.records) {
      data = response.records;
      count = response.total || response.records.length;
    }
    
    tenderData.value = data || [];
    totalCount.value = count || 0;
    
    if (tenderData.value.length > 0) {
      const msg = searchActive.value ? 
        `成功加载 ${tenderData.value.length} 条搜索结果` : 
        `成功加载 ${tenderData.value.length} 条数据`;
      message.success(msg);
    } else {
      message.info('未查询到数据');
    }
  } catch (error: any) {
    console.error('分页数据加载失败:', error);
    tenderData.value = [];
    totalCount.value = 0;
    message.error(`数据加载失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value.page = false;
  }
};

// 重置视图
const resetView = () => {
  pagination.value = { pageNum: 1, pageSize: 10 };
  titleQuery.value = '';
  positionQuery.value = '';
  codeQuery.value = '';
  expandedCardId.value = null;
  showPagination.value = true;
  searchActive.value = false;
  currentQuery.value = { title: '', position: '', code: '' };
  loadPageData();
  message.info('视图已重置');
};

// 切换卡片展开状态
const toggleCardExpansion = (id: number) => {
  if (expandedCardId.value === id) {
    expandedCardId.value = null;
  } else {
    expandedCardId.value = id;
  }
};

// 上一页
const prevPage = () => {
  if (pagination.value.pageNum > 1) {
    pagination.value.pageNum--;
    loadPageData();
  }
};

// 下一页
const nextPage = () => {
  if (pagination.value.pageNum * pagination.value.pageSize < totalCount.value) {
    pagination.value.pageNum++;
    loadPageData();
  }
};

// 格式化金额
const formatCurrency = (amount: number) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(amount);
};

// 获取状态文本
const getStatusText = (item: TenderData) => {
  if (!item.biddingDeadline) return '未知';
  try {
    const now = new Date();
    const deadlineStr = item.biddingDeadline.replace(/-/g, '/').replace(/\./g, '/');
    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) return '日期格式错误';
    if (deadline < now) return '已截止';
    if (item.docStartTime) {
      const startTimeStr = item.docStartTime.replace(/-/g, '/').replace(/\./g, '/');
      const startTime = new Date(startTimeStr);
      if (!isNaN(startTime.getTime()) && startTime > now) return '即将开始';
    }
    return '进行中';
  } catch {
    return '未知';
  }
};

// 获取状态样式类
const getStatusClass = (item: TenderData) => {
  const status = getStatusText(item);
  switch (status) {
    case '已截止': return 'status-expired';
    case '即将开始': return 'status-upcoming';
    case '进行中': return 'status-active';
    default: return 'status-unknown';
  }
};

// 获取解析状态文本
const getParseStatusText = (status: number) => {
  switch (status) {
    case 0: return '待解析';
    case 1: return '解析中';
    case 2: return '解析完成';
    case 3: return '解析失败';
    default: return `未知状态(${status})`;
  }
};

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  if (!text) {
    message.warning('无内容可复制');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制到剪贴板');
  }).catch(() => {
    message.error('复制失败');
  });
};

// 查看原文
const viewOriginal = (url: string) => {
  if (url) {
    window.open(url, '_blank');
  } else {
    message.warning('原文链接不可用');
  }
};
</script>

<style scoped>
.tender-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

/* 头部样式 */
.header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #1890ff;
}

.header h1 {
  color: #1890ff;
  margin-bottom: 10px;
  font-size: 28px;
}

.header-info {
  display: flex;
  justify-content: center;
  gap: 15px;
  color: #666;
  font-size: 14px;
  flex-wrap: wrap;
}

.header-info span {
  padding: 2px 8px;
  background: #f0f8ff;
  border-radius: 4px;
}

/* 查询功能区样式 */
.query-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.query-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.query-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.query-group label {
  font-weight: bold;
  min-width: 80px;
  margin-top: 8px;
}

/* 模糊查询样式 */
.fuzzy-query-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.fuzzy-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.fuzzy-input-group .input-label {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #999;
  background: rgba(255, 255, 255, 0.9);
  padding: 0 4px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.input-small, .input-medium {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.input-small {
  width: 70px;
}

.input-medium {
  width: 180px;
  padding-right: 60px;
}

.select-small {
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
}

/* 按钮样式 */
button {
  cursor: pointer;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-info {
  background: #13c2c2;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #36cfc9;
}

.btn-reset {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-reset:hover {
  background: #e8e8e8;
}

.btn-clear {
  background: #ff4d4f;
  color: white;
}

.btn-clear:hover {
  background: #ff7875;
}

.btn-clear-small {
  background: #ffa39e;
  color: #fff;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 2px;
}

.btn-action {
  background: #f0f0f0;
  color: #666;
  padding: 4px 8px;
  font-size: 12px;
  margin-left: 5px;
}

.btn-action:hover {
  background: #e0e0e0;
}

/* 搜索状态 */
.search-status {
  margin-top: 15px;
  padding: 10px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-active {
  font-weight: bold;
  color: #1890ff;
}

/* 搜索结果统计 */
.search-results {
  margin-bottom: 20px;
  padding: 15px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
}

.search-results h3 {
  margin: 0;
  color: #389e0d;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-icon {
  font-size: 20px;
}

.query-summary {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
  padding: 2px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}

/* 高亮文本 */
.highlight {
  background-color: #fffb8f;
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: bold;
}

/* 卡片副标题 */
.card-subtitle {
  display: flex;
  gap: 10px;
  margin-top: 5px;
  flex-wrap: wrap;
  align-items: center;
}

.card-id {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

/* 分类标签 */
.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-tag {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag:hover {
  background: #bae7ff;
  border-color: #40a9ff;
}

.category-tag.no-category {
  background: #f5f5f5;
  color: #999;
  border-color: #d9d9d9;
}

/* 详情页分类样式 */
.detail-category-item {
  padding: 2px 0;
  color: #333;
  border-bottom: 1px dashed #f0f0f0;
}

.detail-category-item:last-child {
  border-bottom: none;
}

.category-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.category-detail-item {
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
}

.category-detail-item.not-classified {
  background: #fff2f0;
  border-color: #ffccc7;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.category-badge {
  background: #52c41a;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.category-badge.not-classified {
  background: #ff4d4f;
}

.category-time {
  font-size: 11px;
  color: #999;
  margin-left: auto;
}

.category-levels {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-level {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.level-arrow {
  color: #999;
  font-size: 14px;
  margin: 0 4px;
}

.level-code {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.level-name {
  color: #333;
  font-size: 13px;
}

/* 加载状态 */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 招标卡片样式 */
.tender-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.tender-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.tender-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e8e8e8;
}

.card-title {
  flex: 1;
}

.card-title h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
  line-height: 1.4;
}

.card-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-active {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.status-upcoming {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.status-expired {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.status-unknown {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.budget {
  font-size: 16px;
  font-weight: bold;
  color: #fa541c;
}

.card-body {
  padding: 20px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.label {
  font-weight: bold;
  color: #666;
  min-width: 80px;
  margin-right: 8px;
  flex-shrink: 0;
}

.value {
  color: #333;
  flex: 1;
  word-break: break-word;
}

/* 详情区域样式 */
.card-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.details-section {
  margin-bottom: 20px;
}

.details-section h4 {
  color: #1890ff;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e8e8e8;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
}

.detail-label {
  font-weight: bold;
  color: #666;
  min-width: 100px;
  margin-right: 10px;
  flex-shrink: 0;
}

.detail-value {
  color: #333;
  flex: 1;
  word-break: break-word;
}

.detail-link {
  color: #1890ff;
  text-decoration: none;
}

.detail-link:hover {
  text-decoration: underline;
}

.detail-content {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #1890ff;
}

.detail-content p {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #333;
}

.detail-content p:last-child {
  margin-bottom: 0;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
}

.footer-text {
  color: #999;
  font-size: 12px;
}

.footer-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 10px;
}

.empty-state p {
  color: #999;
  margin-bottom: 20px;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-direction: column;
}

.pagination-btns {
  display: flex;
  align-items: center;
  gap: 20px;
}

.pagination-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  background: #40a9ff;
}

.page-info {
  color: #666;
  font-weight: bold;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-info {
    flex-direction: column;
    gap: 5px;
    align-items: center;
  }
  
  .query-group {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .fuzzy-query-controls,
  .pagination-controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .fuzzy-input-group,
  .input-small,
  .input-medium,
  .select-small {
    width: 100%;
  }
  
  .card-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .card-status {
    align-items: flex-start;
  }
  
  .info-row {
    grid-template-columns: 1fr;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
  }
  
  .pagination-btns {
    flex-direction: column;
    gap: 10px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .footer-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>