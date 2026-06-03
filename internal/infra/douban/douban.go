package douban

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/url"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type Book struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	Author      string `json:"author"`
	Rating      string `json:"rating"`
	Cover       string `json:"cover"`
	Publisher   string `json:"publisher"`
	PublishDate string `json:"publish_date"`
	Price       string `json:"price"`
	Summary     string `json:"summary"`
}

type doubanBook struct {
	Id      string `json:"id"`
	Title   string `json:"title"`
	Authors []struct {
		Name string `json:"name"`
	} `json:"authors"`
	Rating struct {
		Average string `json:"average"`
	} `json:"rating"`
	Images struct {
		Large  string `json:"large"`
		Medium string `json:"medium"`
		Small  string `json:"small"`
	} `json:"images"`
	Publisher string `json:"publisher"`
	Pubdate   string `json:"pubdate"`
	Price     string `json:"price"`
	Summary   string `json:"summary"`
}

type doubanResponse struct {
	Count int          `json:"count"`
	Start int          `json:"start"`
	Total int          `json:"total"`
	Books []doubanBook `json:"books"`
}

func (db *doubanBook) FirstAuthor() string {
	if len(db.Authors) > 0 {
		return db.Authors[0].Name
	}
	return ""
}

// GetRecommendations fetches book recommendations from Douban
// Uses popular/trending books as recommendations
func GetRecommendations(count string) []Book {
	size, _ := strconv.Atoi(count)
	if size == 0 || size > 20 {
		size = 10
	}

	// Use various search terms to get diverse recommendations
	searchTerms := []string{
		"小说", "文学", "历史", "哲学", "经济", "科技", "心理学", "传记",
		"推理", "科幻", "悬疑", "爱情", "青春", "散文", "诗歌", "艺术",
	}
	
	// Randomly select a search term for variety
	rand.Seed(time.Now().UnixNano())
	searchTerm := searchTerms[rand.Intn(len(searchTerms))]
	
	return searchBooks(searchTerm, size)
}

// GetRecommendationsByGenre gets recommendations for a specific genre
func GetRecommendationsByGenre(genre string, count string) []Book {
	size, _ := strconv.Atoi(count)
	if size == 0 || size > 20 {
		size = 10
	}
	
	return searchBooks(genre, size)
}

func searchBooks(query string, maxResults int) []Book {
	// Try multiple API endpoints in order of preference
	apiEndpoints := []string{
		"https://douban-api-git-main-hehehai.vercel.app/v2/book/search",
		"https://douban.uieee.com/v2/book/search",
		"https://frodo.douban.com/api/v2/book/search",
	}
	
	for _, apiUrl := range apiEndpoints {
		books := trySearchAPI(apiUrl, query, maxResults)
		if len(books) > 0 {
			return books
		}
	}
	
	// If all APIs fail, return some hardcoded popular Chinese book recommendations
	return getHardcodedRecommendations(maxResults)
}

func trySearchAPI(apiUrl, query string, maxResults int) []Book {
	agent := fiber.AcquireClient().Get(apiUrl)
	agent.QueryString(fmt.Sprintf("q=%s&count=%d", url.QueryEscape(query), maxResults))
	
	// Set user agent to avoid blocking
	agent.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
	
	_, body, err := agent.Bytes()
	if err != nil {
		return []Book{}
	}

	results := doubanResponse{}
	if err := json.Unmarshal(body, &results); err != nil {
		return []Book{}
	}

	books := []Book{}
	for i, book := range results.Books {
		if i >= maxResults {
			break
		}
		
		id, _ := strconv.Atoi(book.Id)
		books = append(books, Book{
			Id:          id,
			Title:       book.Title,
			Author:      book.FirstAuthor(),
			Rating:      book.Rating.Average,
			Cover:       book.Images.Medium,
			Publisher:   book.Publisher,
			PublishDate: book.Pubdate,
			Price:       book.Price,
			Summary:     book.Summary,
		})
	}

	return books
}

// Fallback recommendations when APIs are not available
func getHardcodedRecommendations(maxResults int) []Book {
	recommendations := []Book{
		{Id: 1, Title: "活着", Author: "余华", Rating: "9.4", Publisher: "北京十月文艺出版社", PublishDate: "2012-8", Summary: "一个中国农民的苦难史，记录了人在苦难中的挣扎。"},
		{Id: 2, Title: "百年孤独", Author: "加西亚·马尔克斯", Rating: "9.2", Publisher: "南海出版公司", PublishDate: "2011-6", Summary: "魔幻现实主义的巅峰之作，讲述了布恩迪亚家族七代人的传奇故事。"},
		{Id: 3, Title: "围城", Author: "钱钟书", Rating: "9.0", Publisher: "人民文学出版社", PublishDate: "2007-7", Summary: "一部关于知识分子的经典小说，以独特的幽默展现人生。"},
		{Id: 4, Title: "三体", Author: "刘慈欣", Rating: "9.0", Publisher: "重庆出版社", PublishDate: "2019-1", Summary: "中国科幻文学的里程碑之作，探讨文明与宇宙的关系。"},
		{Id: 5, Title: "红楼梦", Author: "曹雪芹", Rating: "9.6", Publisher: "人民文学出版社", PublishDate: "2008-7", Summary: "中国古典小说的巅峰之作，描述了贾宝玉、林黛玉的爱情悲剧。"},
		{Id: 6, Title: "平凡的世界", Author: "路遥", Rating: "9.0", Publisher: "北京十月文艺出版社", PublishDate: "2012-3", Summary: "描写中国社会的历史变迁，展现普通人的奋斗历程。"},
		{Id: 7, Title: "1984", Author: "乔治·奥威尔", Rating: "9.4", Publisher: "北京燕山出版社", PublishDate: "2010-4", Summary: "反乌托邦小说的经典之作，预言了极权主义社会的恐怖。"},
		{Id: 8, Title: "白夜行", Author: "东野圭吾", Rating: "9.1", Publisher: "南海出版公司", PublishDate: "2008-9", Summary: "推理小说大师东野圭吾的代表作，讲述了一个跨越19年的复仇故事。"},
		{Id: 9, Title: "小王子", Author: "圣埃克苏佩里", Rating: "9.0", Publisher: "人民文学出版社", PublishDate: "2003-8", Summary: "一部关于友谊、爱情和责任的寓言故事。"},
		{Id: 10, Title: "月亮与六便士", Author: "毛姆", Rating: "9.0", Publisher: "上海译文出版社", PublishDate: "2006-8", Summary: "一个证券经纪人突然抛弃家庭，前往南太平洋追求艺术理想的故事。"},
	}
	
	if maxResults > len(recommendations) {
		maxResults = len(recommendations)
	}
	
	// Shuffle recommendations for variety
	rand.Seed(time.Now().UnixNano())
	for i := range recommendations {
		j := rand.Intn(i + 1)
		recommendations[i], recommendations[j] = recommendations[j], recommendations[i]
	}
	
	return recommendations[:maxResults]
}