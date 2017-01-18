'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = `
I think that Haskell has maybe done a bit of a disservice by making so much hay about using monads for side effects. That's super-important in the context of Haskell, of course, but it gives the unfortunate and false impression that that's what they're really about.

I don't know that I'm feeling up to banging out a concrete example in Scheme, but I'd strongly encourage anyone who'd like to see monads being put to good use outside the Haskell space to take a look at the .NET ecosystem. Monads are the soul of LINQ, and F#'s workflows are essentially just monads wearing Groucho glasses.

The procedures that operate on the store described in the previous
sections all take an open connection to the build daemon as their
first argument. Although the underlying model is functional, they
either have side effects or depend on the current state of the
store.

This is kind of ugly. And if I want to compose lots of Maybe values, all of this instanceof nonsense (or having a tagged union in C or whatever) becomes extremely tedious.

I wonder if that's an age thing, I'm 36, I've been programming since I was 7 and seriously since I was 14 (I say seriously since that's when I started doing stuff people would pay for) and I rarely use a debugger.
These days I mostly program in PHP (it's where the money is locally and I actually don't mind the language, it's come along well) and use the excellent FirePHP (it allows you to put fp_log($foo) (fp_log is a wrapper around it I wrote for terseness - it also checks local context so that I don't leak debug stuff out into the wild accidentally) and $foo is then passed to the browser via headers (you need a browser extension to make it work but it integrates into the console) that does for 99% of the debugging I need to do, the 1% is when I fire up XDebug, I like XDebug but I've found over the years that printf debugging solves the vast amount of problems since they nearly always trace back to a faulty assuming about what $foo contains at a given point and it's (at least in interpreted languages) way quicker to just whap a print(foo) etc in there and see.

I concede your point.
I suppose the nice thing here is that we both now have two ways of doing the same thing.
I've explained why I prefer running the underlying tooling; hopefully it will be useful as one of those snippets of internet knowledge.
Independent of debugging, I would contend that this set up is better than running babel-node with something like nodemon, again, because of much better reload times.
Again, thanks for babel-node-debug, I've used it before, and I won't be too surprised if I find myself reaching for it again in the future.

babel sucks - I never though I could hate something so strongly.
Just today I had to deal with the fact that babel wraps ALL your generators in some shit function.
Why ? just why ? generation function was supported in browsers longer then the age all the babel maintainers combined.
The worst part is I do not use babel myself - I wouldn't touch it with a ten foot pole but am forced to use it due to my stupid cowokers writing everything using babel - ( why does babel need .babelrc file ?? - is babel such a prominent part of your life that you need .rc files ?? and why does the .rc file need to be specified in every freaking folder ! )
1) babel's docs are also terrible
2) The people maintaining babel seem to actively market babel and then at the same time ignore questions and requests for better docs from the community.
3) Slowest compiler I have had the pleasure of dealing with - my babel watch process consumes a grand total of 150 MB of memory !!

I am in the same boat as the poster. The main reasons I use typescript instead of scala.js are the vast amount of definition files already made (the scala.js translator of these leaves a lot to be desired), and the fact that it's closer to the es6 community which makes maintenance, contributions, and adoption much more likely. So basically because you stay closer to the JS world.
The only downside is lack of "isomorphic" code reuse which I gladly accept anyways because I rarely see server and client side code reuse as beneficial beyond simple models and validation.

I remember hearing the same argument in the early 80s for the benefit of C vs Assembly. And it actually was a good argument. A lot of people, myself included, learned "real programming" (ie assembly) by using C as training wheels. But a funny thing happened on the way to the forum - C became real programming and nobody remembered or learned assembly - myself included. Then the same thing happened ten years later with the transition from C to C++.

IMO, that list is specific to JS because JS now gives you the ability to optionally add types. Otherwise, there are good arguments to be made for dynamically typed languages and statically typed languages. That is, I have seen a proportionally similar number of maintainable Python projects as Java.

The main problem for me, is that Flow doesn't support Windows (yet?). I've been working solo on a frontend a couple of months now, and the team has just been extended with a new developer (yay). However, he uses Windows, and so all my type annotations are worthless. We're making the switch to TypeScript once 2.0 is released (easier to port with strictNullChecks).

typeof null returns "object", but I do not believe it is correct to claim that null "is an object". It is my understanding (maybe a misunderstanding, I will happily state) from reading a ton of comments from Brendan Eich in various places that typeof null is "object" for historical reasons involving the way reference types were implemented in the original JavaScript VM.

The solution linked to in "Go has a suitable answer" isn't relevant, because it doesn't support virtual methods. You can do the same thing described there in Rust by having a base struct, embedding the base struct in any child structs (composition over inheritance), and implementing Deref/DerefMut on the child if you like.
Go has the exact same set of features Rust has here, no more: struct composition or interfaces/traits.
Regarding graphs: The best solution is option 3, using a crate on crates.io (petgraph is the most popular, but rust-forest is fine too). The preferred solution to having multiple types of nodes in the same tree is to use an enum or a trait. (Servo uses a trait for its flow tree, with downcast methods like as_block() if needed.)
I'm puzzled by the contention that the fact that all nodes have to be the same type is a problem with Rust. That's always true in any language. Even in C, you'd have to have your next/previous pointers have some type, or else you couldn't traverse the list!

Super simple answer, so apologies if it sounds condescending or I've glossed over aspects entirely.
Libs like vue & react are essentially ui renderers, they create the html representation of app state, and handle all the DOM event binding and whatnot for you.
You will likely have some kind of client state management to take care of telling your ui to update, but essentially you will push json into that 'store' and that will then be used by your framework of choice to populate the page with content.
How that json gets there is largely upto you, and will be influenced by what you use to manage state, however you will need to handle getting data from the db server-side. Php or rails are popular, with reams of great (and some not so great) resources out there, but realistically you could use whatever you wanted.
Node.js is nice and could be useful if you want to focus on 1 language initially.

Okay, let's say I put the actual fetch() inside a redux "action creator" how am I fetching that data server-side? How does some arbitrary route know that a nested component needs to fetch() and then populate your store before rendering? And remember, the fetch() in the "action creator" is still trying to hit a relative route.

Here the function 'fact' uses mutable variables (encoded in the use of ST in its type -- ST stands for State Thread) but the function fact is pure -- the call to runST ensures that none of the side effects leak out of 'fact''.
As with most Haskell code, the types are optional - I included them for clarity.

Clojure has "transient" (mutable) forms of its immutable datastructures, which can be bashed in place, but they're not allowed beyond function boundaries in either direction (I think). So you convert (copy?) to transient, mutate it in-place, then convert back to "persistent" before returning it.

I think caching/memoization is one of the most typical cases of this.

I don't like API version numbers in the URI.
It implies that a resource is different just because you are using a newer version of the API.
My own most recent implementations use Accept: and Content-Type to define version compatibility, which is what content negotiation is supposed to be about.
Versioning in the old web API sense meant changing the way the protocol works, and REST will always be REST and the resources will always be resources.
All that is likely to change between 'API versions' is formats, which you negotiate with headers, and adding new fields, which old clients can either ask not to get through content negotiation or can safely ignore.

I can see it both ways.
APIv2 is not the same resource as APIv1, so why send it to the same location? Similarly, APIv1/user/1 may very well not contain the same information as APIv2/user/1, so are they really the same resource? They likely refer to the same semantic resource, but if user/1 != user/1, they're not the same from a data standpoint, which is what APIs are generally used for.

Just to amplify: there's more than a pedantic difference beteen the two. REST has a lot of serious advantages related not only to application architecture and interoperability but also to system architecture and scalability. There's a lot in the original REST dissertation about removing shared state and enabling cacheability.
The crowd that mistakes ROA for REST (I think) sees the stuff in REST that relates directly to development and gets excited - but the stuff related to making their app scale, they ignore. If you don't want to learn a little bit about everything, at least follow the rules that relate to the things you don't know about.

"we'll make the URLs pretty, but we'll ignore the stuff about statelessness."

Exactly. ReST as a concept is not even tied to HTTP. HTTP's design was just heavily influenced my ReST so it happens to be good at it. Somehow people are obsessed over URL formatting and HTTP specificities... while they are important, it's not the literal embodiment of what representation state transfer is, just an implementation of it.
What most people talk about when they say REST are good HTTP practices. Meaningful URLs, proper methods, etc... are all about using HTTP properly. We can call some of these views other acronyms like ROA but it's really just appreciation for proper and modern HTTP stacks.

GET must never have side effects. POST, PUT, DELETE always have side effects.
Pedantry: because they're supposed to be idempotent, POST, PUT, and DELETE should only have side-effects the first time they're issued against a given resource.
Also, RFC 2616 uses "SHOULD NOT", as opposed to "MUST NOT" to describe the behavior of the "safe methods". To wit, "in particular, the convention has been established that the GET and HEAD methods SHOULD NOT have the significance of taking an action other than retrieval."

This has to be the ne plus ultra of Python scaremongering. It describes some sort of bizzaro world of a doomed language which it populates with Machiavellian Python maintainers, brainwashed developers, and a small group of heroic holdouts who see resisting Python 3 as a moral imperative. Apparently having too many string formatting options is a moral issue (three, to be specific).
As someone who writes a _lot_ of Python code (mostly in 3 but with occasional switches to 2), who maintains several libraries which work in both 2 and 3, and as someone who uses a wide range of libraries in stats, machine learning, networking, web development, etc. in my python 3 work...this piece seems totally disconnected from reality. The problems it describes are relentlessly overblown when they're not simply manufactured from whole cloth.
Put another way: the differences between 2 and 3 are not great, the vast majority of libraries you'd want to use (i.e. are actively maintained or of at least good quality) work in 3, and while I don't doubt there's great piles of Python 2 code moldering away big "enterprise" apps and those sorts of places, it's ever been thus in that space, no matter what the language, and doesn't pose any sort of existential threat to Python.
(edit: I used to recommend "Learn Python The Hard Way" to newcomers, and have just kept reflexively doing that over the years because I wasn't aware of a better resource. But if this article has accomplished one thing, it's that it's spurred me to look for a replacement)

I'm pretty sure that if you understand both Turing completeness and the practice of actual programming, then you know that in most cases the one has virtually nothing to do with the other. (Which is not meant at all to imply that the author of linked article understands Turing completeness, just that even though he doesn't seem to he could still be excellent at teaching programming.)

First I spit my coffee when I read that too, but let me play devil's advocate (because I pretty much disagree with the entirety of his rant) : he's pointing out that since it's technically feasible to write a Python 2 interpreter in Python 3, and since it should even be pretty easy since the two languages do not differ immensely, then the only reason why it hasn't been done and there's no -2 flag to python3 has to be an ideological reason, a manipulation by the core devs to impose their ideas by force.
It's extremely badly conveyed but that's what I got out of it by keeping reading.
I do disagree with him on all the rest though, especially strings. It didn't "just work" before, it failed silently and who knows how much disaster he or his readers have caused because of it. Now at least you can't be wrong anymore. For a language heavily used on the web, it's hugely important to understand where your strings are coming from and where they're going to, and how.
Besides, Python is not a frigging "beginners language". Just because Python (and admittedly especially Python 2) is generally easy to grasp as a first language doesn't mean it's its purpose, nor should it constrain itself toward this goal. It's used in a million of different areas, including pretty sensitive ones. It's now become a more mature language, reaching for exactitude and consistency. Just because Zac no longer has an easy toy language to point script kiddies to so they can "learn to program" by reading one website doesn't mean Python is to blame.

Marshmallow is really useful. +1. If you like Marshmallow, you might also like Pilo (https://github.com/eventbrite/pilo), which solves similar problems. Marshmallow excels at ORM object serialization. Pilo is really good at parsing JSON into Python objects, and has several features to support this, such as polymorphic downcasting and programmable parsing via hooks. Marshmallow is also very good at parsing/validating Python dictionaries, but in my experience, Marshmallow's API is more focused on serializing objects into dictionaries so that you can call json.dumps on the output dictionary.

Whoever wrote this needs somebody to take the fall. And that's Phreak, and that's Joey, and that's us.

To make free international calls I would call a home country direct which is a toll free number locally in South Africa or another country and connects you directly with an AT&T or MCI or whatever operator in the USA. Then send a combination of 2600hz and 2400hz through the mouthpiece to put the trunk on the USA side into a kind of command mode. Then use the CCITT5 signaling system (which is basically DTMF but with different tones) to tell it to route a call for me. One of the tones - I think it was KP1 or KP2 could be used to tell the trunk to route the call via satellite or undersea cable (cable being the better quality because of no propagation delay).
Seizing trunks like this was similar to the cap'n crunch whistle which emmitted a 2600hz tone in the USA and in the 70's you could use that to seize a trunk in the USA. International trunks were different so we'd need a 2600/2400 tone. But the phone companies would put filters on the line, so you could do things like adding an additional frequency to the mix, or using 2600/2400 and sloooowly increasing the volume until you hear that wonderful 'KERCHUNK' sound and silence. Of course you're doing this as the phone's ringing and then an AT&T operator answers and is hearing giggling and these weird tones until his line just goes dead and we're routing the call.
I once routed a call through a few countries back into South Africa to my best friends house. The delay on the line was epic - like 10 seconds.
Recently I decided I miss the good old days of it being very hard to get international bandwidth, so I went out and got myself a ham license. (callsign WT1J) So now whenever I feel the need for it to be really hard to send data internationally, I jump on the HF bands and play around with digital modes, sending data to someone in australia using JT65 (designed for moonbounce) and only 5 watts on 14 megahertz. Makes bluebeep and CCITT5 seem like a breeze.

 keep approximately 5 minutes of temp readings (used a TMP36 sensor) at 1 minute intervals using an RTC (Real Time Clock) to more accurately time it. I made a small 'power tester' circuit that basically acts like a normally open button and closes when there's no power coming into the freezer. I may or may not have spliced into the wiring of the freezer for this and lied to my wife about it when she asked if I was going to burn the house down.
Side note: Is it just me or does it seem like you get asked this question frequently?
I have the 'button' circuit wired into an Arduino I/O pin just like you would an old normally open button. When the 'button' circuit closes the Arduino triggers a VERY audible siren I cut out of an old water leak detector. If I have 5 minutes above my temp threshold the siren goes off. I upgraded it over time to use a small LiOn battery and got a circuit to switch to it when incoming power is cut for whatever reason, and basically when in battery mode it's also siren time. I got through 10 minutes of siren battery testing before deciding it was good enough and I was tired of hearing it.

The vast majority of anything you'll ever need, even in absurdly complex scenarios, are built in.
If you need to do something really wild and weird, the plugin and loader architecture will let you do pretty much anything and hook into nearly everything.
We're dealing with a legacy environment here and we have a suite of plugins and loaders to handle non-standard module types, deal with files pulled from CDN at build time, deal with legacy Rails-style script imports, plugins to do all sort of bundle validation, splitting, transforming...really anything goes.

That's my concern as well, I use browserify and a simple bash script to do some clever stuff I couldn't reliably do with Grunt, I'd hate to lose the flexibility.

Rollup's gains come mainly from the way it combines modules into a single scope, rather than wrapping them in functions and shipping a module loader with the bundle. It's not uncommon to see parse/evaluate time plummet when switching to Rollup because of this, which is often more important than the number of bytes.

I'm also trying to wrap my brain around what webpack is, since I've been thus far conditioned to think of the build runner (e.g. gulp) and the bundle maker (e.g. browserify) as being separate.
The article seems to be saying this, but am I correct to come away thinking of webpack as a "module-aware build runner" that replaces both gulp and browserify (for example)?

HATEOAS (the 4th principle) also seems to be gravely misunderstood. It only means that the API should have a version that is fully useable in a web browser.
No, it doesn't. In fact, a REST API can fully meet the requirements Fielding lays out without having any implementation that uses any communication protocol used by any web browser. REST is an architectural pattern that is independent of communication protocols.

There are two paradigms with databases. Normalization for high volume insert/update transaction requirements (faster writes). Denormalization for (faster reads), typically used for data warehouses and reporting.
NoSQL is designed to support both of these scenarios well. And with lower overhead requirements by not having to update a central store... It is used in particular for Big Data solutions. Rather than having to be optimized for one or the other as an RDBMS would require.

The point is you have the level of control that lets you optimize for your use case. RDBMSes are a jack-of-all-trades solution and have the advantage of needing very little customization, but they can't be as well-optimized for specific use cases.

The entire concept of database normalization is just a manifestation of DRY. Foreign keys exist so you don't repeat yourself by duplicating the same data in two databases.

I'm afraid our experience is very different. I find the programming world to be full of people who will interpret guidelines like DRY with almost religious dogmatism, particularly if anyone Internet famous can be cited as the source.
Having been a mentor to many younger and less experienced programmers when they started working professionally, I have been the guy who had to clear up their absolute, literal belief in these sayings. Some people will quickly understand and accept that the world isn't as black and white as perhaps their CS course/favourite blogger/previous boss said or that they have taken rules of thumb too literally. Some never really do understand that, and their code reflects their lack of understanding and often looks like it was written to comply with every saying under the sun as its primary goal.

Virtual inheritance means you have a diamond pattern and haven't separated your components properly.
I've seen this argument pop out time and again as if it was a mantra of sorts, and more often than not it comes from someone with a background almost exclusively founded on Java.
Their line of reasoning essentially boils down to "Java doesn't support it, the people behind Java said something about it, therefore it's bad".
But C++ isn't Java, nor does Java dictate what is correct or what makes sense.
Particularly when the only assertion you could come up with to criticize multiple inheritance was a comment that had nothing to do with C++ or even OO programming, but only to do with your personal taste regarding your superficial impressions regarding software design.

Ooo, that Java remark burns. I've only touched Java seriously in the last few years of my career, I'm a hardcore C++/native type.
Here's the issues I take with virtual inheritance:
1. It complicates the vtable and function/member calls leading to another level of indirection, so from a performance perspective it's a negative mark.
2. The more fundamental problem is that you've botched the hasA vs isA association. If you have two classes that share a base class then that base class should be refactored into a component that can then be used as a member without polluting the class hierarchy. This leads to better composability since you can now pass this object around without pulling a whole class hierarchy with it.
You're welcome to use virtual inheritance all you want in your projects but much like knowing what subset of C++ to use(and what not) you'll never see it in code I work on.

I strongly disagree that "code reuse" is a reason to use inheritance in C++/Java. Composition nicely solves that problem. In fact, I would argue that someone who believes code reuse is an appropriate reason to use inheritance does not understand OO programming as well as they believe.

Although Ruby's "modules" are indeed preferable to inheritance they are usually as inappropriate as inheritance.

One of my pet peeves is how PRCE destroyed the definition of "regular" in regular expressions. It has basically made a huge number of programmers illiterate as to what truly is regular in the formal sense.

It's very clever, but obnoxiously slow. It's useful for code golf and as a pretty impressive party trick. But like your banker will not be impressed with your college funding plan of pulling a quarter out of his ear, this is not going to make it in any real use.
Imagine naive absolute-beginner-programmer trial division. This is worse. Now add the overhead of counting via regex backtracking and integer comparison via matching strings. A fair number of regex engines will also start using enormous amounts of memory.
AKS is of theoretical interest, but not really a "normal test." It's very slow in practice, being beat by even decent trial division for 64-bit inputs (it's eventually faster, as expected, but it takes a while). But it is quickly faster than this exponential-time method. The regex is in another universe of time taken when compared to the methods typically used for general form inputs (e.g. pretests + Miller-Rabin or BPSW, with APR-CL or ECPP for proofs).
As others have noted, "has been popularized by Perl" is because it was created by Abigail, who is a well-known Perl programmer (though almost certainly a polyglot). It's also been brought up many times, though it's a nice new blog article. I hope the OP found something better when "researching the most efficient way to check if a number is prime." In general the answer is a hybrid of methods depending on the input size, form, input expectation, and language. The optimal method for a 16-bit input is different than for a 30k-digit input, for example.

Horrific. It's implicitly checking for every divisor (which is O(n)) but there's also the complexity from using a regex engine (which can be O(n*m)). So the overall complexity is probably of the order O(n^2).

Sure it is. But I won't use Java for web stuff. I might use it for some background services, but for regular CRUD functionality, Java buys me nothing. I generally use Python(Flask)/Jinja2/Flask-SqlAlchemy. Flask is intuitive; Jinja2 is pleasant and fast; Flask-SQLAlchemy is concise with the option of exploring the raw power of SQLAlchemy. For regular use cases, nothing in Java beats this combination. I have looked at Play; it comes closer but it's still not there.

I think the most interesting and quickest to explain thing I've done with these chips (the ESP8266) was a chain of temperature/humidity sensors packed in my office building.
I only ended up building out a couple (soldering by hand on prototype boards) but I used a ESP8266 + 1200mAh battery pack + DHT22 sensors to make small modules we could put in different corners of the building. We had A/C issues during hot summers and it's a lot easier to report them to the building management by saying "4 conference rooms have been above 80 degrees all day". The modules woke themselves up every 30 min, waited until a stable recording was captured, then POST'd their hardcoded label (like "Corner office"), the temperature, the humidity, and the time to a Heroku server (which when loaded in a browser simply spat out all records).


Your description of "human intelligence" sounds more like a bounded random number generator. Also, your thinking is restricted by sensory input - just like the AI.

That brings an interesting point. I'm not particularly well informed here, but i'm curious. Most genetic algorithms I've seen work by taking a source adding a "mutation" then testing it against a goal. How would a genetic algorithm change if there wasn't a defined goal, but instead an eco-system that decides for itself what is most desirable.

Lisp is an acceptable language for a variety of things, not just "scripting". I work on many projects written in Guile Scheme that range from game engines to static site generators to dynamic web applications to package managers, and I write one-off scripting tasks with it, too. There's a lot of mystique around Lisp and Scheme, and people tend to write it off as a relic of academia, but I use it for practical needs every day. Lisps enable a type of development via live coding that I have yet to see a non-Lisp match. I've used the REPL for doing everyday calculator tasks to live coding video games, and I've used it for customizing an X11 window manager in the past, too.
But rather than read about me confess my love for Lisp, I recommend that people just pick a Lisp that looks fun and take it for a spin. You might find a lot to like.

To me, the live loading of code and repl is a two edged sword, and I'm not sure which side is sharper.
It sounds great to say "live coding" and whatnot, but it turns out that you very quickly get the repl into an unknown state where you aren't sure what version of what has been eval'd, and what temporary cruft is lying around changing how your program behaves.
A number of times I would find out that a bug I thought I squashed was actually still there, just hidden by some temporary "what-if" I had eval'd. The only way to know is to clean the workspace and reload everything.
This was recognized as problematic by the clojure community and "Component" methodologies were developed, along with namespace refreshing. It would be far less useable if not for this.
However, in a live production system, a blanket reload of anything kind of defeats the purpose of keeping it running. I don't think I'd ever try loading code on a live production system unless all the alternatives were worse than possibly messing up the state of the system.
It's nice to have the repl for investigating what's going on in production, for inspection. But I avoid any code reloading in a live system.

Interestingly, your test fails on IE11-in-IE10-mode (although I think only IE11 was affected by the issue).
I would not mind changing it to do feature detecting, but only if we can eliminate false positives (because this is not an internal change; it affects the public API and starting to concatenate text nodes could break people's apps).

This sounds like a general support question. Please, use one of the appropriate support channels for these types of questions (providing more info and/or a reproduction).

As I workaround, I have decided to base64 encode my date instead of url encoding.

I believe a simple else containing httpConfig[key] = copy(value); would suffice to fix the issue.

This is not related to core Angular.

The function angular.mock.inject.strictDi(value) appears to be documented. I would attempt perhaps to provide documentation but I am not even sure if this function is intended for use.`.replace(/\s+/g, ' ');