<template>
  <div class="page-container">
    <!-- Header -->
    <div class="app-header">
      <Title :level="1">本と内容を探す</Title>
      <Text type="secondary"> 本のタイトル・内容をキーワードで検索する </Text>
    </div>

    <!-- Steps -->
    <div class="steps-container">
      <Steps :current="currentStep - 1" size="small">
        <Step
          title="本を探す"
          description="本を選択してから内容を検索できます。"
        />
        <Step
          title="内容を探す"
          description="該当する内容が含まれるページを検索する"
        />
      </Steps>
    </div>

    <!-- Step 1: Book Search -->
    <div v-if="currentStep === 1">
      <!-- Book Search Card -->
      <Card title="本を探す" style="margin-bottom: 24px">
        <InputSearch
          v-model:value="bookQuery"
          placeholder="タイトルから探す"
          size="large"
          name="book-search"
          autocomplete="on"
          :loading="loading"
          @search="searchBooks(1)"
          enter-button="検索"
        />
      </Card>

      <!-- Selected Books -->
      <Card
        v-if="selectedBooks.length > 0"
        title="選択中の本"
        class="selected-books"
      >
        <template #extra>
          <Text type="secondary"> {{ selectedBooks.length }}/10 選択中 </Text>
        </template>

        <div style="margin-bottom: 16px">
          <Tag
            v-for="book in selectedBooks"
            :key="book.id"
            color="blue"
            closable
            @close="removeBook(book)"
            style="margin-bottom: 8px"
          >
            <Space>
              {{ book.name }}
            </Space>
          </Tag>
        </div>

        <Button
          type="primary"
          size="large"
          @click="goToContentSearch"
          :disabled="selectedBooks.length === 0"
        >
          内容検索へ進む
          <template #icon><ArrowRightOutlined /></template>
        </Button>
      </Card>

      <!-- Book Results -->
      <Card v-if="totalBooks > 0" title="検索結果">
        <template #extra>
          <Text type="secondary"> {{ totalBooks }} 件 </Text>
        </template>

        <List
          :data-source="displayedBooks"
          item-layout="vertical"
          :pagination="{
            current: currentPage,
            pageSize: BOOKS_PER_PAGE,
            total: totalBooks,
            showSizeChanger: false,
            onChange: searchBooks,
          }"
        >
          <template #renderItem="{ item }">
            <ListItem>
              <Card
                :class="['book-card', { selected: isBookSelected(item) }]"
                size="small"
              >
                <template #extra>
                  <Checkbox
                    :checked="isBookSelected(item)"
                    @change="() => toggleBookSelection(item)"
                  />
                </template>

                <CardMeta>
                  <template #title>
                    <Text
                      class="book-name"
                      @click="goToFirstPageOfBook(item.id)"
                    >
                      {{ item.name }}
                    </Text>
                  </template>
                  <template #description>
                    <div>
                      <!-- <Text>by {{ item.author }}</Text> -->
                      <!-- <br /> -->
                      <Text type="secondary">
                        作成日時：
                        {{ new Date(item.created_at).toLocaleString('ja-jp') }}
                      </Text>
                    </div>
                  </template>
                </CardMeta>
              </Card>
            </ListItem>
          </template>
        </List>
      </Card>
    </div>

    <!-- Step 2: Content Search -->
    <div v-if="currentStep === 2">
      <!-- Back Button -->
      <Button @click="goBackToBookSearch" style="margin-bottom: 24px">
        <template #icon><ArrowRightOutlined /></template>
        Back to Book Selection
      </Button>

      <!-- Content Search Card -->
      <Card title="Search Content" style="margin-bottom: 24px">
        <template #extra>
          <Text type="secondary">
            Searching in {{ selectedBooks.length }} books
          </Text>
        </template>

        <InputSearch
          v-model:value="contentQuery"
          placeholder="Enter keywords to search within books..."
          size="large"
          :loading="contentLoading"
          @search="searchContent"
          enter-button="Search"
        />
      </Card>

      <!-- Content Results -->
      <Card v-if="searchResults.length > 0" title="Content Results">
        <template #extra>
          <Text type="secondary">
            {{ searchResults.length }} matches found
          </Text>
        </template>

        <div
          v-for="result in searchResults"
          :key="result.id"
          class="search-result"
        >
          <div style="margin-bottom: 8px">
            <Space>
              <!-- <Icon type="file-text" /> -->
              <Text strong>{{ result.bookTitle }}</Text>
              <Text type="secondary">• Page {{ result.page }}</Text>
            </Space>
          </div>

          <Paragraph style="margin-bottom: 8px; line-height: 1.6">
            <span v-html="highlightText(result.content, contentQuery)"></span>
          </Paragraph>

          <Text type="secondary" italic>
            {{ result.context }}
          </Text>
        </div>
      </Card>

      <!-- Empty Content Results -->
      <Empty
        v-if="!contentLoading && contentQuery && searchResults.length === 0"
        style="margin-top: 48px"
      >
        <template #description>
          <span>No content found for "{{ contentQuery }}"</span>
        </template>
      </Empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Card,
  Typography,
  Steps,
  Step,
  InputSearch,
  Button,
  Tag,
  Space,
  List,
  ListItem,
  CardMeta,
  Checkbox,
  Empty,
  message,
} from 'ant-design-vue'
import { ArrowRightOutlined } from '@ant-design/icons-vue'
import { searchBookByName } from '@/api'
import { useRouter } from 'vue-router'

const { Title, Text, Paragraph } = Typography

interface Book {
  id: number
  name: string
}

interface SearchResult {
  id: number
  bookTitle: string
  page: number
  content: string
  context: string
}

// Reactive state
const currentStep = ref(1)
const bookQuery = ref('')
const contentQuery = ref('')
const totalBooks = ref(0)
const displayedBooks = ref<Book[]>([])
const selectedBooks = ref<Book[]>([])
const searchResults = ref<SearchResult[]>([])
const currentPage = ref(1)
const BOOKS_PER_PAGE = 20
const loading = ref(false)
const contentLoading = ref(false)

const mockSearchResults = ref([
  {
    id: 1,
    bookTitle: 'The Great Gatsby',
    page: 45,
    content:
      'In his blue gardens men and girls came and went like moths among the whisperings and the champagne and the stars.',
    context:
      "The party scene description where Gatsby's extravagant lifestyle is portrayed through vivid imagery.",
  },
  {
    id: 2,
    bookTitle: '1984',
    page: 123,
    content:
      'Big Brother is watching you. The Party seeks power entirely for its own sake.',
    context:
      "Winston's realization about the totalitarian nature of the Party's control over society.",
  },
  {
    id: 3,
    bookTitle: 'To Kill a Mockingbird',
    page: 87,
    content:
      'You never really understand a person until you climb into his skin and walk around in it.',
    context:
      "Atticus Finch's advice to Scout about empathy and understanding others.",
  },
])

// Methods
const searchBooks = async (page: number) => {
  if (bookQuery.value.trim().length < 2) {
    message.warning('二文字以上を入力してください')
    return
  }

  loading.value = true
  currentPage.value = page

  try {
    const result = await searchBookByName(bookQuery.value, {
      page,
      limit: BOOKS_PER_PAGE,
    })
    if (!result) throw 'search failed'

    displayedBooks.value = result.data
    totalBooks.value = result.pagination.total

    if (displayedBooks.value.length === 0) {
      message.info('一致する本は見つかりませんでした')
    }
  } catch (error) {
    message.error('エラーが発生しました')
    console.error('Search error:', error)
  } finally {
    loading.value = false
  }
}

const isBookSelected = (book: Book) => {
  return selectedBooks.value.some((b) => b.id === book.id)
}

const toggleBookSelection = (book: Book) => {
  if (isBookSelected(book)) {
    selectedBooks.value = selectedBooks.value.filter((b) => b.id !== book.id)
  } else if (selectedBooks.value.length < 10) {
    selectedBooks.value = [...selectedBooks.value, book]
  } else {
    message.warning('You can select at most 10 books')
  }
}

const removeBook = (book: Book) => {
  selectedBooks.value = selectedBooks.value.filter((b) => b.id !== book.id)
}

const goToContentSearch = () => {
  if (selectedBooks.value.length === 0) {
    message.warning('Please select at least one book')
    return
  }
  currentStep.value = 2
}

const goBackToBookSearch = () => {
  currentStep.value = 1
}

const searchContent = async () => {
  if (!contentQuery.value.trim()) {
    message.warning('Please enter search keywords')
    return
  }

  if (selectedBooks.value.length === 0) {
    message.warning('Please select books first')
    return
  }

  contentLoading.value = true

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Filter results based on selected books
    const relevantResults = mockSearchResults.value.filter((result) =>
      selectedBooks.value.some((book) => book.title === result.bookTitle),
    )

    searchResults.value = relevantResults

    if (relevantResults.length === 0) {
      message.info(`No content found for "${contentQuery.value}"`)
    } else {
      message.success(`Found ${relevantResults.length} matches`)
    }
  } catch (error) {
    message.error('Failed to search content')
    console.error('Content search error:', error)
  } finally {
    contentLoading.value = false
  }
}

const highlightText = (text: string, query: string) => {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

const router = useRouter()
const goToFirstPageOfBook = (id: number) => {
  router.push({
    name: 'proofreading',
    params: { bookId: id, page: 1 },
  })
}
</script>

<style>
.highlight {
  background-color: #fff2b8;
  font-weight: 600;
  padding: 0 2px;
  border-radius: 2px;
}

.book-card {
  transition: all 0.3s ease;
  &.selected {
    border-color: #1890ff;
    background-color: #f0f8ff;
  }
}

.book-name {
  cursor: pointer;
  &:hover {
    color: var(--primary-blue);
  }
}

.search-result {
  border-left: 4px solid #1890ff;
  padding-left: 16px;
  margin-bottom: 24px;
}

.steps-container {
  margin-bottom: 32px;
  .ant-steps-item-title {
    font-weight: 700;
  }
}

.selected-books {
  margin-bottom: 24px;
}

.app-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-container {
  padding: 24px 0;
}
</style>
